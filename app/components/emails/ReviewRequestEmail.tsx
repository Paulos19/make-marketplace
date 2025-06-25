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

interface ReviewRequestEmailProps {
  buyerName: string; // Espera uma 'string', não 'string | null'
  productName: string;
  reviewLink: string;
}

export const ReviewRequestEmail: React.FC<Readonly<ReviewRequestEmailProps>> = ({
  buyerName,
  productName,
  reviewLink,
}) => (
  <Html>
    <Head />
    <Preview>Sua opinião é importante: Avalie sua compra de {productName}</Preview>
    <Tailwind>
      <Body className="bg-slate-100 p-4 font-sans text-base text-slate-800">
        <Container className="bg-white border border-slate-200 p-8 rounded-lg max-w-lg mx-auto">
          <Section className="text-center mb-8">
            <Img
              src="https://www.zacaplace.com.br/logo.svg"
              width="180"
              alt="Zacaplace Logo"
            />
          </Section>

          <Heading as="h2" className="text-2xl font-bold text-zaca-roxo text-center">
            Gostou do seu Achadinho?
          </Heading>

          <Text className="text-base leading-relaxed">
            Olá, <strong>{buyerName}</strong>!
          </Text>

          <Text className="text-base leading-relaxed">
            Esperamos que você esteja a adorar o seu produto: <strong>"{productName}"</strong>. A sua opinião é muito importante para nós e para outros compradores na comunidade Zacaplace.
          </Text>

          <Text className="text-base leading-relaxed">
            Que tal tirar um minutinho para deixar uma avaliação?
          </Text>

          <Section className="text-center my-8">
            <Button
              className="bg-purple-600 text-white font-bold py-3 px-6 rounded-md"
              href={reviewLink}
            >
              Avaliar Agora
            </Button>
          </Section>

          <Hr className="border-slate-200 my-6" />

          <Text className="text-xs text-slate-500 text-center">
            Agradecemos por fazer parte da nossa comunidade!
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default ReviewRequestEmail;
