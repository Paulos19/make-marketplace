import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ReviewRequestEmailProps {
  buyerName: string
  productName: string
  sellerName: string
  reviewLink: string
}

export const ReviewRequestEmail = ({
  buyerName,
  productName,
  sellerName,
  reviewLink,
}: ReviewRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>Avalie sua recente compra no Zacaplace!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`} // Adapte para a sua logo
          width="120"
          height="auto"
          alt="Zacaplace"
          style={logo}
        />
        <Text style={paragraph}>Olá {buyerName},</Text>
        <Text style={paragraph}>
          Obrigado por comprar no Zacaplace! Esperamos que você tenha gostado do
          seu produto: <strong>{productName}</strong>, vendido por{' '}
          <strong>{sellerName}</strong>.
        </Text>
        <Text style={paragraph}>
          Sua opinião é muito importante para nós e para toda a comunidade. Por
          favor, tire um momento para avaliar sua experiência.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={reviewLink}>
            Deixar uma Avaliação
          </Button>
        </Section>
        <Text style={paragraph}>
          Atenciosamente,
          <br />A equipe do Zacaplace
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReviewRequestEmail

// Estilos
const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif' };
const container = { margin: '0 auto', padding: '20px 0 48px' };
const logo = { margin: '0 auto' };
const paragraph = { fontSize: '16px', lineHeight: '26px' };
const btnContainer = { textAlign: 'center' as const, marginTop: '32px' };
const button = { backgroundColor: '#5D3A9E', borderRadius: '3px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', padding: '12px', };
