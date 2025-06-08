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
  Img,
  Button,
  Tailwind,
} from '@react-email/components';

// CORREÇÃO: Adicionada a propriedade 'subject' para corresponder aos dados da API
interface MarketingEmailProps {
  subject: string;
  headline: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
}

 const MarketingEmail: React.FC<Readonly<MarketingEmailProps>> = ({
  subject,
  headline,
  body,
  ctaText,
  ctaLink,
  imageUrl,
}) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Tailwind>
        <Body style={main}>
        <Container style={container}>
            <Section style={logoContainer}>
              <Img
                  src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.svg`}
                  width="180"
                  height="50"
                  alt="Zacaplace"
              />
            </Section>
            <Heading style={h1}>{headline}</Heading>
            {imageUrl && (
                <Section style={{ marginBottom: '20px' }}>
                    <Img src={imageUrl} width="560" style={image} alt={headline} />
                </Section>
            )}
            <Text style={text}>{body}</Text>
            <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
              <Button style={{...button, padding: '14px 24px'}} href={ctaLink}>
                  {ctaText}
              </Button>
            </Section>
            <Text style={footer}>
              Zacaplace - O seu marketplace de achadinhos.
            </Text>
        </Container>
        </Body>
    </Tailwind>
  </Html>
);

// Estilos para máxima compatibilidade
const main = { backgroundColor: '#f6f9fc', padding: '10px 0' };
const container = { backgroundColor: '#ffffff', border: '1px solid #f0f0f0', padding: '45px', width: '600px', margin: '0 auto' };
const logoContainer = { marginTop: '32px', textAlign: 'center' as const };
const h1 = { color: '#4A0D67', fontFamily: "'Bangers', cursive, sans-serif", fontSize: '36px', fontWeight: 'bold', margin: '30px 0', padding: '0', textAlign: 'center' as const };
const text = { color: '#333', fontFamily: "Arial, sans-serif", fontSize: '16px', lineHeight: '24px' };
const button = { backgroundColor: '#f97316', borderRadius: '5px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block' };
const footer = { color: '#8898aa', fontSize: '12px', lineHeight: '16px' };
const image = { borderRadius: '5px', margin: '0 auto' };

export default MarketingEmail;
