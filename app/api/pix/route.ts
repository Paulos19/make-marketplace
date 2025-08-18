import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError, AxiosInstance } from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';

// --- As funções authenticate e GNRequest continuam as mesmas ---
interface Credentials {
  clientID: string;
  clientSecret: string;
}

const authenticate = ({ clientID, clientSecret }: Credentials): Promise<any> => {
    const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
    const cert = fs.readFileSync(path.resolve(process.cwd(), `certs/${process.env.GN_CERT}`));
    const agent = new https.Agent({ pfx: cert, passphrase: '' });
    return axios({
        method: 'POST',
        url: `${process.env.GN_ENDPOINT}/oauth/token`,
        headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
        httpsAgent: agent,
        data: { grant_type: 'client_credentials' },
    });
};

const GNRequest = async (credentials: Credentials): Promise<AxiosInstance> => {
    const authResponse = await authenticate(credentials);
    const accessToken = authResponse.data?.access_token;
    const cert = fs.readFileSync(path.resolve(process.cwd(), `certs/${process.env.GN_CERT}`));
    const agent = new https.Agent({ pfx: cert, passphrase: '' });
    return axios.create({
        baseURL: process.env.GN_ENDPOINT,
        httpsAgent: agent,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
};

// Handler para a requisição POST
export async function POST(req: NextRequest) {
  try {
    const { valor }: { valor: string } = await req.json();

    if (!valor || isNaN(parseFloat(valor))) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }
    
    const pixKey = process.env.GN_PIX_KEY;
    if (!pixKey) {
        console.error("❌ [Erro Configuração] Variável de ambiente GN_PIX_KEY não definida.");
        return NextResponse.json({ error: "Erro interno de configuração do servidor" }, { status: 500 });
    }

    const reqGN = await GNRequest({
      clientID: process.env.GN_CLIENT_ID!,
      clientSecret: process.env.GN_CLIENT_SECRET!,
    });

    const dataCob = {
      calendario: { expiracao: 3600 },
      valor: { original: parseFloat(valor).toFixed(2) },
      chave: pixKey,
      solicitacaoPagador: 'Pagamento via QR Code PIX',
    };

    const cobResponse = await reqGN.post('/v2/cob', dataCob);
    const locId: number = cobResponse.data.loc.id;
    const qrcodeResponse = await reqGN.get(`/v2/loc/${locId}/qrcode`);

    // Apenas retorna a imagem do QR Code, sem salvar nada no DB
    return NextResponse.json({
      qrcodeImage: qrcodeResponse.data.imagemQrcode,
    });

  } catch (error: any) {
    const axiosError = error as AxiosError<any>;
    console.error("❌ [Erro API PIX] Falha ao gerar Pix:", axiosError.response?.data || axiosError.message);
    const errorMessage = axiosError.response?.data?.mensagem || axiosError.response?.data?.title || "Erro ao gerar o Pix";
    const errorStatus = axiosError.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
