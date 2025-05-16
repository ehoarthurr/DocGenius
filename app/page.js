"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);

  const hasMessages = messages.length > 0;

  // Função para rolar para o final do chat
  const scrollToBottom = () => {
    if (messagesContainerRef.current && !userScrolled) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Detectar quando o usuário rola manualmente
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      // Consideramos que o usuário rolou se não estiver próximo do final
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setUserScrolled(!isAtBottom);
    }
  };

  // Rolar para o final quando as mensagens mudarem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Resetar o userScrolled quando o usuário envia uma nova mensagem
  useEffect(() => {
    if (isLoading) {
      setUserScrolled(false);
    }
  }, [isLoading]);

  // Ajustar a altura do textarea automaticamente
  useEffect(() => {
    if (textareaRef.current) {
      // Reset altura para evitar comportamento de "ratcheting"
      textareaRef.current.style.height = "auto";
      // Calcular nova altura baseada no conteúdo
      const newHeight = Math.min(
        textareaRef.current.scrollHeight,
        // Altura aproximada por linha (~24px) * 5 linhas + padding maior (22px)
        24 * 5 + 22
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  const callGeminiAPI = async (userInput) => {
    setIsLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 32768,
        responseMimeType: "text/plain",
      };

      const data = {
        generationConfig,
        contents: [
          {
            role: "user",
            parts: [{ text: userInput }],
          },
        ],
        systemInstruction: {
          role: "user",
          parts: [
            {
              text: `
Você é um gerador automático de documentação de código-fonte. Sua função é analisar qualquer trecho de código fornecido e gerar uma documentação detalhada, clara e completa, ideal para desenvolvedores e profissionais técnicos.

Regras e Diretrizes:
Entrada esperada: Apenas código-fonte.

Se a entrada não for código-fonte, responda com:
"Desculpe, isso não me parece um código."
Não realize nenhuma outra ação ou comentário.

Objetivo: Reescrever o código fornecido com o máximo de documentação possível, em formato técnico organizado e salvo como um arquivo .md

Especificações da Documentação:
Linguagem da documentação:

Use português técnico e claro como padrão.

Adapte a linguagem se o público-alvo for conhecido.

Formato de saída:

Markdown formatado corretamente.

Não inclua blocos de código Markdown (ou seja, não use crases ou ''').

A documentação deve começar com um título nível 1 (#).

Não inclua nenhum texto fora da documentação.

Conteúdo da documentação:

Descrição geral do propósito do código.

Explicações completas para:

Funções, métodos e classes.

Parâmetros e seus tipos esperados.

Valores de retorno e seus significados.

Estruturas de dados utilizadas.

Fluxos lógicos e interações entre componentes.

Regras de negócio e comportamentos importantes.

Comentários explicativos linha a linha, quando aplicável.

Exemplos de uso, se forem úteis para a compreensão.

Estilo da documentação:

Clareza, precisão e completude são prioritários.

Organização lógica em seções e subtítulos.

Utilize listas, tabelas e marcações de destaque para facilitar a leitura.              
              `,
            },
          ],
        },
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/learnlm-2.0-flash-experimental:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return (
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Não foi possível gerar documentação."
      );
    } catch (error) {
      console.error("Erro ao chamar a API Gemini:", error);
      return "Erro ao gerar documentação. Por favor, tente novamente.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const newMessage = {
        id: Date.now(),
        text: inputValue,
        sender: "user",
      };
      setMessages([...messages, newMessage]);
      setInputValue("");

      // Add loading message
      const loadingMessage = {
        id: Date.now() + 1,
        text: "Gerando documentação...",
        sender: "system",
        isLoading: true,
      };
      setMessages((prevMessages) => [...prevMessages, loadingMessage]);

      // Call Gemini API
      const responseText = await callGeminiAPI(inputValue);

      // Remove loading message and add actual response
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now() + 2,
            text: responseText,
            sender: "system",
          },
        ];
      });
    }
  };

  const handleKeyDown = (e) => {
    // Permitir Tab para inserir espaços
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      // Inserir 4 espaços (em vez de 2)
      const newValue =
        inputValue.substring(0, start) + "    " + inputValue.substring(end);
      setInputValue(newValue);

      // Mover o cursor para depois dos espaços inseridos
      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          start + 4;
      }, 0);
    }

    // Shift+Enter para pular linha sem enviar
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      // Inserir quebra de linha
      const newValue =
        inputValue.substring(0, start) + "\n" + inputValue.substring(end);
      setInputValue(newValue);

      // Mover o cursor para depois da quebra de linha
      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          start + 1;
      }, 0);
    }

    // Enter sem Shift envia a mensagem
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Layout fixo com título no topo */}
      <div className="flex flex-col h-full">
        {/* Título fixo no topo */}
        <div className="w-full text-center py-4 bg-background">
          <h1
            className={`font-bold ${hasMessages ? "text-[2vw]" : "text-[3vw]"}`}
          >
            DocGenius
          </h1>
        </div>

        {/* Área de conteúdo principal - chat messages */}
        <div
          className="flex-1 overflow-auto p-4"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {hasMessages ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-[80%] ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    } ${message.isLoading ? "animate-pulse" : ""}`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p
                            {...props}
                            className="prose prose-sm dark:prose-invert max-w-none break-words"
                          />
                        ),
                        pre: ({ node, ...props }) => (
                          <pre
                            {...props}
                            className="overflow-x-auto p-4 bg-gray-900 text-gray-100 rounded-md my-3 shadow-md"
                          />
                        ),
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code
                              {...props}
                              className="bg-gray-200 dark:bg-gray-100 text-black px-1 py-0.5 rounded text-sm"
                            />
                          ) : (
                            <code
                              {...props}
                              className="font-mono text-[14px] bg-gray-900 text-gray-100 my-2"
                            />
                          ),
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            className="max-w-full h-auto rounded"
                          />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto">
                            <table
                              {...props}
                              className="border-collapse text-sm my-2"
                            />
                          </div>
                        ),
                        h1: ({ node, ...props }) => (
                          <h1
                            {...props}
                            className="text-xl font-bold mt-4 mb-2"
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            {...props}
                            className="text-lg font-bold mt-3 mb-2"
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            {...props}
                            className="text-md font-bold mt-3 mb-1"
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul {...props} className="list-disc pl-5 my-2" />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol {...props} className="list-decimal pl-5 my-2" />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} className="mb-1" />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            {...props}
                            className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2"
                          />
                        ),
                        hr: ({ node, ...props }) => (
                          <hr
                            {...props}
                            className="my-3 border-gray-300 dark:border-gray-600"
                          />
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Insira seu código ou faça o upload de um arquivo
              </p>
            </div>
          )}
        </div>

        {/* Barra de input fixada na parte inferior */}
        <div className="w-full p-4 bg-background">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <textarea
              ref={textareaRef}
              placeholder="Insira o seu código..."
              className="flex-1 min-h-[40px] px-4 py-3 rounded-md border border-input bg-background resize-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={Math.min(inputValue.split("\n").length || 1, 5)}
              style={{
                overflow: inputValue.split("\n").length > 5 ? "auto" : "hidden",
                height: "auto",
              }}
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="default"
              disabled={isLoading}
              className="h-[46px]" // Altura ajustada para combinar com o textarea (40px + 6px de padding)
            >
              {isLoading ? "Processando..." : "Enviar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
