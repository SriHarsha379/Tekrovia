'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function AssessmentPage() {
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments/free`);
        setAssessment(await res.json());
      } catch (error) {
        console.error('Failed to fetch assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, []);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: 'free-assessment',
          answers: Object.entries(answers).map(([questionId, value]) => (
            typeof value === 'number'
              ? { questionId, selectedAnswer: value }
              : { questionId, textAnswer: String(value) }
          ))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.roadmap) {
        console.error('Submit failed:', data);
        return;
      }
      setResult(data);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    }
  };

  if (loading) return <div className="p-8">Loading assessment...</div>;

  if (!assessment) return <div className="p-8">Failed to load assessment</div>;

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg text-center space-y-2">
              <p className="text-gray-600">Your Score</p>
              <p className="text-5xl font-bold text-blue-600">{result.percentage}%</p>
              <Badge variant="outline" className="mt-2">{result.readinessLevel}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600">Correct Answers</p>
                  <p className="text-3xl font-bold text-green-600">{result.correctAnswers}/{result.totalQuestions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600">Overall Score</p>
                  <p className="text-3xl font-bold text-blue-600">{result.score}/100</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-900">{result.feedback}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Recommended Learning Path</h3>
              {result.roadmap.map((phase, idx) => (
                <Card key={idx} className="bg-gradient-to-r from-blue-50 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Phase {phase.phase}</p>
                        <h4 className="font-semibold">{phase.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{phase.courses.join(', ')}</p>
                      </div>
                      <Badge variant="secondary">{phase.duration}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg">View Recommended Courses</Button>
              <Button className="w-full" variant="outline" size="lg">Book Free Counseling</Button>
              <Button className="w-full" variant="outline" size="lg">Explore All Packages</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.totalQuestions) * 100;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{assessment.title}</CardTitle>
          <CardDescription>{assessment.description}</CardDescription>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestion + 1} of {assessment.totalQuestions}</span>
              <span>Est. {assessment.estimatedTime} mins</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <Badge variant="outline" className="mb-3">{question.category}</Badge>
            <h2 className="text-xl font-semibold">{question.question}</h2>
          </div>

          {question.type === 'MULTIPLE_CHOICE' && (
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <label key={idx} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="radio"
                    name={question.id}
                    value={idx}
                    checked={answers[question.id] == idx}
                    onChange={() => handleAnswerChange(question.id, idx)}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'SHORT_ANSWER' && (
            <textarea
              placeholder="Type your answer here..."
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full p-3 border rounded-lg min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
          className="flex-1"
        >
          Previous
        </Button>

        {currentQuestion === assessment.totalQuestions - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < assessment.totalQuestions}
            className="flex-1"
          >
            Submit Assessment
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className="flex-1"
          >
            Next Question
          </Button>
        )}
      </div>
    </div>
  );
}
