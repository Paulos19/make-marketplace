import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Button, Tailwind, Img } from '@react-email/components';

interface PurchaseConfirmationEmailProps {
  userName: string | null;
  planName: string;
  price: string;
}

export const PurchaseConfirmationEmail: React.FC<Readonly<PurchaseConfirmationEmailProps>> = ({ userName, planName, price }) => (
  <Html>
    <Head />
    <Preview>Pagamento Confirmado: {planName}</Preview>
    <Tailwind>
      <Body className="bg-slate-100 p-4 font-sans">
        <Container className="bg-white border border-slate-200 p-8 rounded-lg max-w-lg mx-auto">
          <Section className="text-center mb-8">
            <Img src="https://www.zacaplace.com.br/logo.svg" width="180" alt="Zacaplace Logo" />
          </Section>
          <Heading as="h2" className="text-2xl font-bold text-purple-700 text-center">Pagamento Confirmado, Cumpadi!</Heading>
          <Text className="text-slate-700 text-base leading-relaxed">
            Olá, {userName || 'Zaca'}. Sua compra foi confirmada com sucesso!
          </Text>
          <Section className="my-6 p-4 border-t border-b border-slate-200">
            <Text className="my-1"><strong>Plano/Produto:</strong> {planName}</Text>
            <Text className="my-1"><strong>Valor Pago:</strong> {price}</Text>
          </Section>
          <Text className="text-slate-700 text-base leading-relaxed">
            Seus benefícios já estão ativos. Você pode gerenciar suas assinaturas e compras no seu painel.
          </Text>
          <Section className="text-center my-6">
            <Button className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md" href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
              Ir para o Painel
            </Button>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default PurchaseConfirmationEmail;
