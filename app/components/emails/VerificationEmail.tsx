import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Button, Tailwind, Img } from '@react-email/components';

interface VerificationEmailProps {
  name: string | null;
  verificationLink: string;
}

export const VerificationEmail: React.FC<Readonly<VerificationEmailProps>> = ({ name, verificationLink }) => (
  <Html>
    <Head />
    <Preview>Só falta um tiquinho, verifique seu email no Zacaplace!</Preview>
    <Tailwind>
        <Body className="bg-slate-100 p-4 font-sans">
        <Container className="bg-white border border-slate-200 p-8 rounded-lg max-w-lg mx-auto">
            <Section className="text-center mb-8">
                <Img src="https://www.zacaplace.com.br/logo.svg" width="180" alt="Zacaplace Logo" />
            </Section>
            <Heading as="h2" className="text-2xl font-bold text-purple-700 text-center">Só falta um tiquinho, Cumpadi {name || ''}!</Heading>
            <Text className="text-slate-700 text-base leading-relaxed">
              Obrigado por se juntar à trupe do Zacaplace! Para começar a farra (e as compras!), precisamos que você verifique seu email clicando no botão mágico abaixo:
            </Text>
            <Section className="text-center my-6">
              <Button className="bg-pink-500 text-white font-bold py-3 px-6 rounded-md" href={verificationLink}>
                  Verificar Meu Email Agora!
              </Button>
            </Section>
            <Text className="text-slate-700 text-base leading-relaxed">Este link é válido por <strong>24 horas</strong>.</Text>
            <Text className="text-sm text-slate-500">Se você não se cadastrou, pode ignorar este email que não dá nada!</Text>
            <Section className="border-t border-slate-200 mt-6 pt-4 text-center text-xs text-slate-500">
                Abraços apertados (mas sem amassar o chapéu!),<br/>Equipe Zacaplace
            </Section>
        </Container>
        </Body>
    </Tailwind>
  </Html>
);