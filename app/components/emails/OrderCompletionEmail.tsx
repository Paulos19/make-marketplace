import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Button, Tailwind } from '@react-email/components';

interface OrderCompletionEmailProps {
  clientName: string | null;
  productName: string;
  sellerName: string | null;
  reviewLink: string;
}

export const OrderCompletionEmail: React.FC<Readonly<OrderCompletionEmailProps>> = ({ clientName, productName, sellerName, reviewLink }) => (
  <Html>
    <Head />
    <Preview>✅ Pedido Entregue! Avalie sua compra.</Preview>
    <Tailwind>
      <Body className="bg-slate-100 p-4 font-sans">
        <Container className="bg-white border border-slate-200 p-8 rounded-lg max-w-lg mx-auto">
          <Heading as="h2" className="text-2xl font-bold text-green-600">Oba, {clientName || 'Cumpadi'}! Seu produto chegou!</Heading>
          <Text className="text-slate-700 text-base leading-relaxed">O vendedor <strong>{sellerName || 'Zaca'}</strong> confirmou a entrega do seu produto: <strong>{productName}</strong>.</Text>
          <Text className="text-slate-700 text-base leading-relaxed">A gente espera que você tenha amado seu achadinho! Que tal deixar uma avaliação e contar pra todo mundo como foi sua experiência?</Text>
          <Section className="text-center my-6">
            <Button className="bg-orange-500 text-white font-bold py-3 px-6 rounded-md" href={reviewLink}>
              Deixar minha Avaliação
            </Button>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);