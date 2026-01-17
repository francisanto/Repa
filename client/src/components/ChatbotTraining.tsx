import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Plus, Trash2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface TrainingData {
  id: string;
  question: string;
  answer: string;
}

export function ChatbotTraining() {
  const [isOpen, setIsOpen] = useState(false);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const { toast } = useToast();

  const handleAdd = () => {
    if (!question.trim() || !answer.trim()) {
      toast({ title: "Error", description: "Please fill in both question and answer", variant: "destructive" });
      return;
    }

    const newData: TrainingData = {
      id: Date.now().toString(),
      question: question.trim(),
      answer: answer.trim(),
    };

    setTrainingData([...trainingData, newData]);
    setQuestion("");
    setAnswer("");
    toast({ title: "Success", description: "Training data added! AI will learn from this." });
  };

  const handleDelete = (id: string) => {
    setTrainingData(trainingData.filter(d => d.id !== id));
    toast({ title: "Deleted", description: "Training data removed" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg">
            <Bot className="w-4 h-4 mr-2" />
            Train AI Chatbot
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Train Your AI Assistant
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question/Query</Label>
              <Input
                placeholder="e.g., How do I create an event?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Answer/Response</Label>
              <Textarea
                placeholder="Provide the answer you want the AI to give..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleAdd} className="w-full bg-gradient-to-r from-primary to-cyan-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Training Data
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">Training Data ({trainingData.length})</h3>
            {trainingData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No training data yet. Add some to teach your AI!</p>
            ) : (
              trainingData.map((data) => (
                <Card key={data.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold text-slate-900">Q: {data.question}</p>
                        <p className="text-sm text-slate-600">A: {data.answer}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(data.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

