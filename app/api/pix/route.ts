// app/api/pix/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { PurchaseType } from '@prisma/client';
import axios, { AxiosError, AxiosInstance } from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto'; // Importa o gerador de UUID nativo do Node.js

// --- Funções de autenticação da Efí (continuam as mesmas) ---

interface Credentials {
  clientID: string;
  clientSecret: string;
}

const authenticate = ({ clientID, clientSecret }: Credentials): Promise<any> => {
  const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
  const certPath = path.resolve(process.cwd(), 'certs', process.env.GN_CERT!);
  const cert = fs.readFileSync(certPath);
  const agent = new https.Agent({ pfx: cert, passphrase: '' });

  return axios({
    method: 'POST',
    url: `${process.env.GN_ENDPOINT}/oauth/token`,
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    httpsAgent: agent,
    data: { grant_type: 'client_credentials' },
  });
};

const getGNRequestInstance = async (credentials: Credentials): Promise<AxiosInstance> => {
  const authResponse = await authenticate(credentials);
  const accessToken = authResponse.data?.access_token;
  const certPath = path.resolve(process.cwd(), 'certs', process.env.GN_CERT!);
  const cert = fs.readFileSync(certPath);
  const agent = new https.Agent({ pfx: cert, passphrase: '' });

  return axios.create({
    baseURL: process.env.GN_ENDPOINT,
    httpsAgent: agent,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
};

// --- Handler POST Adaptado ---

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let newPurchase;
  try {
    const { valor, tipo, productId } = (await req.json()) as {
      valor: string;
      tipo: PurchaseType;
      productId?: string;
    };
    
    // Validações...
    if (!valor || isNaN(parseFloat(valor)) || !tipo) {
      return NextResponse.json({ error: 'Valor e tipo da compra são obrigatórios' }, { status: 400 });
    }
    if (!Object.values(PurchaseType).includes(tipo)) {
        return NextResponse.json({ error: 'Tipo de compra inválido' }, { status: 400 });
    }
    if ((tipo === 'ACHADINHO_TURBO' || tipo === 'CARROSSEL_PRACA') && !productId) {
        return NextResponse.json({ error: 'ProductId é obrigatório para este tipo de compra' }, { status: 400 });
    }

    // ✨✨✨ A CORREÇÃO ESTÁ AQUI ✨✨✨
    // Geramos um UUID único como placeholder para o txid.
    const temporaryTxid = randomUUID().replace(/-/g, ''); // Gera um ID único e remove os hifens

    newPurchase = await prisma.purchase.create({
      data: {
        type: tipo,
        status: 'PENDING',
        paymentMethod: 'PIX',
        userId: session.user.id,
        productId: productId,
        pixPayment: {
          create: {
            status: 'PENDING',
            txid: `temp_${temporaryTxid}`, // Usamos o placeholder único
            userId: session.user.id,
          },
        },
      },
      include: {
        pixPayment: true,
      },
    });

    // Preparar e realizar a chamada para a API da Efí...
    const pixKey = process.env.GN_PIX_KEY;
    if (!pixKey) {
      console.error("❌ [Erro Configuração] Variável de ambiente GN_PIX_KEY não definida.");
      throw new Error("Erro interno de configuração do servidor");
    }

    const reqGN = await getGNRequestInstance({
      clientID: process.env.GN_CLIENT_ID!,
      clientSecret: process.env.GN_CLIENT_SECRET!,
    });

    const dataCob = {
      calendario: { expiracao: 3600 },
      valor: { original: parseFloat(valor).toFixed(2) },
      chave: pixKey,
      solicitacaoPagador: `Compra de ${tipo.replace('_', ' ')} no Zacaplace`,
    };

    // Criamos a cobrança usando nosso ID temporário como "txid" para a Efí.
    // A Efí exige um txid com [a-zA-Z0-9] e entre 26 e 35 caracteres.
    const cobResponse = await reqGN.put(`/v2/cob/${temporaryTxid}`, dataCob);
    const txid: string = cobResponse.data.txid; // Este será o mesmo `temporaryTxid`
    const locId: number = cobResponse.data.loc.id;

    // Atualizar o registro no banco com o txid REAL (que é o mesmo que geramos)
    await prisma.pixPayment.update({
        where: { id: newPurchase.pixPayment!.id },
        data: { txid: txid }
    });
    
    const qrcodeResponse = await reqGN.get(`/v2/loc/${locId}/qrcode`);

    return NextResponse.json({
      txid: txid,
      imagemQrcode: qrcodeResponse.data.imagemQrcode,
    });

  } catch (error: any) {
    const axiosError = error as AxiosError<any>;
    console.error("❌ [Erro API PIX] Falha ao gerar Pix:", axiosError.response?.data || axiosError.message);
    
    if (newPurchase) {
      await prisma.purchase.delete({ where: { id: newPurchase.id }});
      console.log(`🗑️ Compra ${newPurchase.id} revertida devido a erro na API.`);
    }

    const errorMessage = axiosError.response?.data?.mensagem || axiosError.response?.data?.title || "Erro ao gerar o Pix";
    const errorStatus = axiosError.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}