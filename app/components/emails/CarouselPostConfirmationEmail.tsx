// app/components/emails/CarouselPostConfirmationEmail.tsx
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

interface CarouselPostConfirmationEmailProps {
  userName: string | null;
  productName: string;
  productImageUrl: string | null;
}

export const CarouselPostConfirmationEmail: React.FC<Readonly<CarouselPostConfirmationEmailProps>> = ({
  userName,
  productName,
  productImageUrl,
}) => (
  <Html>
    <Head />
    <Preview>Seu Achadinho está no Carrossel do Zaca!</Preview>
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
            Seu Produto foi Divulgado!
          </Heading>

          <Text className="text-base leading-relaxed">
            Olá, <strong>{userName || 'Vendedor(a)'}</strong>!
          </Text>

          <Text className="text-base leading-relaxed">
            Boas notícias! O seu produto <strong>"{productName}"</strong> foi aprovado e já está a brilhar no nosso Carrossel na Praça. Prepara-se para receber mais visitas e vender muito!
          </Text>

          {productImageUrl && (
            <Section className="my-6 text-center">
              <Img
                src={productImageUrl}
                alt={productName}
                width="200"
                className="rounded-md mx-auto border border-slate-200"
              />
            </Section>
          )}

          <Text className="text-base leading-relaxed">
            Agradecemos por usar os nossos serviços para impulsionar as suas vendas.
          </Text>

          <Section className="text-center my-8">
            <Button
              className="bg-zaca-azul text-white font-bold py-3 px-6 rounded-md"
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
            >
              Ver meu Painel
            </Button>
          </Section>

          <Hr className="border-slate-200 my-6" />

          <Text className="text-xs text-slate-500 text-center">
            Equipa Zacaplace
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default CarouselPostConfirmationEmail;
