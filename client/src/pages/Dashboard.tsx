import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Instagram, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [urls, setUrls] = useState("");
  const [resultsLimit, setResultsLimit] = useState(200);

  const startScraping = trpc.scraping.start.useMutation({
    onSuccess: () => {
      toast.success("Scraping iniciado com sucesso!");
      setUrls("");
      utils.scraping.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar scraping: ${error.message}`);
    },
  });

  const { data: scrapings, isLoading } = trpc.scraping.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const utils = trpc.useUtils();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = urls.split("\\n").filter(u => u.trim());
    if (urlList.length === 0) {
      toast.error("Adicione pelo menos uma URL");
      return;
    }
    startScraping.mutate({ urls: urlList, resultsLimit });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      error: "destructive",
      pending: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Instagram className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Viral Spy
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Analise perfis do Instagram e descubra o que faz conteúdo viralizar
          </p>
        </div>

        {/* Novo Scraping */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Novo Scraping
            </CardTitle>
            <CardDescription>
              Cole as URLs dos perfis do Instagram que deseja analisar (uma por linha)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="urls">URLs do Instagram</Label>
                <textarea
                  id="urls"
                  className="w-full min-h-[120px] p-3 border rounded-md"
                  placeholder="https://www.instagram.com/username1/&#10;https://www.instagram.com/username2/"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="limit">Limite de Posts</Label>
                <Input
                  id="limit"
                  type="number"
                  value={resultsLimit}
                  onChange={(e) => setResultsLimit(Number(e.target.value))}
                  min={1}
                  max={1000}
                />
              </div>
              <Button type="submit" disabled={startScraping.isPending} className="w-full">
                {startScraping.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  "Iniciar Análise"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Histórico */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Histórico de Análises</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : scrapings && scrapings.length > 0 ? (
            <div className="grid gap-4">
              {scrapings.map((scraping) => (
                <Card key={scraping.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(scraping.status)}
                          <h3 className="font-semibold text-lg">
                            Análise #{scraping.id}
                          </h3>
                          {getStatusBadge(scraping.status)}
                        </div>
                        {scraping.currentStep && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {scraping.currentStep}
                          </p>
                        )}
                        {scraping.progress !== null && scraping.progress > 0 && (
                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{scraping.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${scraping.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(scraping.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {scraping.spreadsheetUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={scraping.spreadsheetUrl} target="_blank" rel="noopener noreferrer">
                              Ver Dados
                            </a>
                          </Button>
                        )}
                        {scraping.analysisUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={scraping.analysisUrl} target="_blank" rel="noopener noreferrer">
                              Ver Análise
                            </a>
                          </Button>
                        )}
                        {scraping.assistantId && (
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/chat/${scraping.id}`}>
                              Chat com IA
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Nenhuma análise realizada ainda. Comece criando uma nova análise acima!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
