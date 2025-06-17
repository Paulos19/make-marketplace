// app/components/emails/ReservationNotificationEmail.tsx
import * as React from 'react';
import { 
  Html, 
  Body, 
  Head, 
  Heading, 
  Container, 
  Preview, 
  Section, 
  Text, 
  Button, 
  Tailwind, 
  Img 
} from '@react-email/components';

// Interface para as propriedades do componente
interface ReservationNotificationEmailProps {
  sellerName: string | null | undefined;
  clientName: string | null | undefined;
  clientContact?: string | null | undefined;
  productName: string;
  quantity: number; // A quantidade é recebida como número
  reservationsUrl: string;
}

export const ReservationNotificationEmail: React.FC<Readonly<ReservationNotificationEmailProps>> = ({ 
  sellerName, 
  clientName, 
  clientContact, 
  productName, 
  quantity, // O tipo aqui é 'number'
  reservationsUrl 
}) => (
  <Html>
    <Head />
    {/* A conversão para string acontece aqui dentro do template literal, o que é seguro */}
    <Preview>{`🎉 Nova Reserva: ${quantity}x ${productName}!`}</Preview>
    <Tailwind>
      <Body className="bg-slate-100 p-4 font-sans">
        <Container className="bg-white border border-slate-200 p-8 rounded-lg max-w-lg mx-auto">
          
          <Section className="text-center mb-8">
              <Img src="https://www.zacaplace.com.br/logo.svg" width="180" alt="Zacaplace Logo" />
          </Section>

          <Heading as="h2" className="text-2xl font-bold text-purple-700">Ô psit, {sellerName || 'Vendedor(a)'}! Notícia boa na área!</Heading>
          
          <Text className="text-slate-700 text-base leading-relaxed">
            Você recebeu uma nova reserva na sua lojinha do Zacaplace. Dá uma espiada nos detalhes, cumpadi:
          </Text>
          
          <Section className="my-6 p-4 border-t border-b border-slate-200">
            <Text className="my-1"><strong>Produto:</strong> {productName}</Text>
            
            {/* <<< CORREÇÃO APLICADA AQUI >>>
              O erro de tipo é resolvido envolvendo a variável 'quantity' em um template literal `${...}`.
              Isso converte explicitamente o número para uma string, que é um tipo válido para ser renderizado pelo React.
            */}
            <Text className="my-1"><strong>Quantidade Reservada:</strong> {`${quantity}`} unidade(s)</Text>
            
            <Text className="my-1"><strong>Cliente:</strong> {clientName || 'Cliente Interessado'}</Text>
            {clientContact && <Text className="my-1"><strong>Contato do Cliente:</strong> {clientContact}</Text>}
          </Section>

          <Text className="text-slate-700 text-base leading-relaxed">
            Que tal dar um alô pro cliente e combinar os próximos passos? Não vá "moscar", hein!
          </Text>
          
          <Section className="text-center my-6">
            <Button className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md" href={reservationsUrl}>
              Gerenciar Minhas Reservas
            </Button>
          </Section>

        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default ReservationNotificationEmail;
