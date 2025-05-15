import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative h-full flex flex-col">
      {/* Título de fundo */}
      <h1 className="absolute text-[3vw] font-bold text-black-100/20 select-none pointer-events-none text-center w-full top-1/2 -translate-y-1/2">
        DocGenius
      </h1>

      {/* Área de conteúdo principal */}
      <div className="flex-1 p-4 relative z-10 overflow-auto">
        {/* Aqui você pode adicionar o conteúdo principal da sua aplicação */}
      </div>

      {/* Barra de input fixada na parte inferior */}
      <div className="w-full p-4 relative z-10">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input placeholder="Digite aqui" className="flex-4" />
          <Button type="submit">Enviar</Button>
        </div>
      </div>
    </div>
  );
}
