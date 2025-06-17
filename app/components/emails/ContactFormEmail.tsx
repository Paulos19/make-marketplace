import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Tailwind } from '@react-email/components';

interface ContactFormEmailProps {
  fromName: string;
  fromEmail: string;
  message: string;
}

export const ContactFormEmail: React.FC<Readonly<ContactFormEmailProps>> = ({ fromName, fromEmail, message }) => (
  <Html>
    <Head />
    <Preview>Nova Mensagem de Contato de {fromName}</Preview>
    <Tailwind>
      <Body className="bg-slate-100 p-4 font-sans">
        <Container className="bg-white border border-slate-200 p-8 rounded-lg max-w-lg mx-auto">
          <Heading as="h2" className="text-xl font-bold text-slate-800">Nova Mensagem de Contato</Heading>
          <Section className="my-4">
            <Text><strong>Nome:</strong> {fromName}</Text>
            <Text><strong>Email:</strong> {fromEmail}</Text>
          </Section>
          <Section className="p-4 border border-slate-200 rounded-md bg-slate-50">
            <Heading as="h3" className="text-lg font-semibold mt-0">Mensagem:</Heading>
            <Text className="whitespace-pre-wrap">{message}</Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);