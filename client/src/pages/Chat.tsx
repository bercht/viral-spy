import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, User, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useRoute, Link } from "wouter";

export default function Chat() {
  const { user } = useAuth();
  const [, params] = useRoute("/chat/:id");
  const scrapingId = params?.id ? parseInt(params.id) : null;
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: scraping } = trpc.scraping.get.useQuery(
    { id: scrapingId! },
    { enabled: !!scrapingId }
  );

  const { data: messages, isLoading } = trpc.chat.getMessages.useQuery(
    { scrapingId: scrapingId! },
    { enabled: !!scrapingId, refetchInterval: 3000 }
  );

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.chat.getMessages.invalidate({ scrapingId: scrapingId! });
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !scrapingId) return;
    sendMessage.mutate({ scrapingId, message: message.trim() });
  };

  if (!scrapingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>ID de scraping inválido</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chat com Assistente IA</h1>
            {scraping && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Análise #{scraping.id}
              </p>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-[calc(100vh-250px)] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Assistente de Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Bot className="h-16 w-16 mb-4 opacity-50" />
                <p>Nenhuma mensagem ainda. Comece a conversar!</p>
              </div>
            )}
          </CardContent>
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sendMessage.isPending}
                className="flex-1"
              />
              <Button type="submit" disabled={sendMessage.isPending || !message.trim()}>
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
