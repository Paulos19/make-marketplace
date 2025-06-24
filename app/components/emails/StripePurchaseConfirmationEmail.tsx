// app/components/emails/StripePurchaseConfirmationEmail.tsx
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
  Img,
  Hr,
} from '@react-email/components';

interface StripePurchaseConfirmationEmailProps {
  userName: string | null;
  planName: string;
  price: string;
  isSubscription: boolean;
}

export const StripePurchaseConfirmationEmail: React.FC<Readonly<StripePurchaseConfirmationEmailProps>> = ({
  userName,
  planName,
  price,
  isSubscription,
}) => (
  <Html>
    <Head />
    <Preview>🎉 Pagamento Confirmado no Zacaplace: {planName}</Preview>
    <Tailwind>
      <Body className="bg-slate-100 p-4 font-sans text-base text-slate-800">
        <Container className="bg-white border border-slate-200 p-8 rounded-lg max-w-lg mx-auto">
          <Section className="text-center mb-8">
            <Img
              src="https://www.zacaplace.com.br/logo.svg" // Garanta que este link esteja acessível publicamente
              width="180"
              alt="Zacaplace Logo"
            />
          </Section>

          <Heading as="h2" className="text-2xl font-bold text-zaca-roxo text-center">
            Pagamento Confirmado, Cumpadi!
          </Heading>

          <Text className="text-base leading-relaxed">
            Olá, <strong>{userName || 'Zaca'}</strong>!
          </Text>

          <Text className="text-base leading-relaxed">
            Sua compra no Zacaplace foi um estouro e já está confirmada. Obrigado por
            confiar no nosso trabalho e fortalecer o comércio local!
          </Text>

          <Hr className="border-slate-200 my-6" />

          <Section className="mb-6">
            <Heading as="h3" className="text-lg font-semibold text-slate-700">Resumo da Compra:</Heading>
            <Text className="my-1"><strong>Plano/Produto:</strong> {planName}</Text>
            <Text className="my-1"><strong>Valor Pago:</strong> {price}</Text>
          </Section>

          <Text className="text-base leading-relaxed">
            {isSubscription
              ? 'Sua assinatura já está ativa e será renovada automaticamente. Você pode gerenciá-la a qualquer momento no seu painel.'
              : 'Seu benefício de compra única já está ativo!'}
          </Text>

          <Section className="text-center my-8">
            <Button
              className="bg-zaca-azul text-white font-bold py-3 px-6 rounded-md"
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
            >
              Ir para o Painel
            </Button>
          </Section>

          <Hr className="border-slate-200 my-6" />

          <Text className="text-xs text-slate-500 text-center">
            Se você não reconhece esta transação, por favor, entre em contato com nosso suporte imediatamente.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default StripePurchaseConfirmationEmail;
