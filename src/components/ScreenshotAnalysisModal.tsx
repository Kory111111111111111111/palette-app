'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { AnalysisQuestion } from '@/types';

interface ScreenshotAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: AnalysisQuestion[];
  imagePreview: string;
  isAnalyzing: boolean;
  onAnalyze: () => Promise<void>;
  onGenerate: (answers: Record<string, string>) => Promise<void>;
  isGenerating: boolean;
  error?: string;
}

export function ScreenshotAnalysisModal({
  open,
  onOpenChange,
  questions,
  imagePreview,
  isAnalyzing,
  onAnalyze,
  onGenerate,
  isGenerating,
  error
}: ScreenshotAnalysisModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<'analyzing' | 'questions' | 'generating'>('analyzing');

  useEffect(() => {
    if (open) {
      setCurrentStep('analyzing');
      setAnswers({});
    }
  }, [open]);

  useEffect(() => {
    console.log('🔄 [ScreenshotAnalysisModal] State change effect triggered');
    console.log('🔄 [ScreenshotAnalysisModal] Questions length:', questions.length);
    console.log('🔄 [ScreenshotAnalysisModal] Is analyzing:', isAnalyzing);
    console.log('🔄 [ScreenshotAnalysisModal] Current step:', currentStep);
    
    if (questions.length > 0 && !isAnalyzing) {
      console.log('🔄 [ScreenshotAnalysisModal] Transitioning to questions step');
      setCurrentStep('questions');
    }
  }, [questions, isAnalyzing, currentStep]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleGenerate = async () => {
    setCurrentStep('generating');
    await onGenerate(answers);
  };

  const allQuestionsAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  const handleClose = () => {
    if (!isAnalyzing && !isGenerating) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Screenshot Analysis
            {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            AI is analyzing your uploaded UI screenshot to generate personalized questions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden">
          {/* Image Preview */}
          <div className="flex gap-6 flex-shrink-0">
            <div className="flex-shrink-0">
              <Label className="text-sm font-medium mb-2 block">Uploaded Screenshot</Label>
              <div className="w-48 h-32 border border-border rounded-lg overflow-hidden bg-muted">
                <OptimizedImage
                  src={imagePreview}
                  alt="Screenshot for analysis"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            <div className="flex-1">
              {currentStep === 'analyzing' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing Your Screenshot
                    </CardTitle>
                    <CardDescription>
                      Our AI is examining your UI design to understand the context and generate relevant questions...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Image uploaded successfully
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        Analyzing UI elements and color scheme
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                        Generating personalized questions
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 'questions' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Analysis Complete
                    </CardTitle>
                    <CardDescription>
                      Based on your screenshot, we&apos;ve generated some questions to help create the perfect color palette.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {currentStep === 'generating' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating Your Palette
                    </CardTitle>
                    <CardDescription>
                      Creating a customized color palette based on your screenshot and preferences...
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      Analysis Failed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={onAnalyze}
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Questions */}
          {currentStep === 'questions' && questions.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
                <Label className="text-base font-semibold">
                  Please answer these questions to help us create your perfect palette:
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {Object.keys(answers).length} of {questions.length} questions answered
                </p>
              </div>
              
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full w-full rounded-md border">
                  <div className="p-4">
                    <div className="space-y-6">
                      {questions.map((question, index) => (
                        <div key={question.id} className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium leading-none">
                              {index + 1}. {question.question.replace(/'/g, '&apos;')}
                            </h4>
                          </div>
                          
                          <RadioGroup
                            value={answers[question.id] || ''}
                            onValueChange={(value) => handleAnswerChange(question.id, value)}
                            className="space-y-3"
                          >
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                                <Label 
                                  htmlFor={`${question.id}-${optionIndex}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          
                          {index < questions.length - 1 && (
                            <div className="border-t border-border pt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isAnalyzing || isGenerating}>
            Cancel
          </Button>
          
          {currentStep === 'questions' && (
            <Button 
              onClick={handleGenerate}
              disabled={!allQuestionsAnswered || isGenerating}
              className="min-w-32"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Generate Palette
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
