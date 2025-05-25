import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ajuste o caminho se necessário
import { redirect } from "next/navigation";
import Image from 'next/image'; // Para exibir a imagem do usuário

// Definir um tipo para os dados do usuário que esperamos da API
interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  whatsappLink: string | null;
  profileDescription: string | null;
  role?: string | null; // Adicionado para consistência
}

async function getUsersForAdmin(): Promise<AdminUser[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // A sessão será verificada pela API route, então não precisamos passar headers de autenticação explícitos aqui
  // se a chamada for feita do lado do servidor e os cookies forem encaminhados (o que o fetch padrão faz no Route Handlers e Server Components)
  const res = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Para garantir que os dados sejam sempre frescos
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch users for admin:", errorText);
    // Lançar um erro pode ser uma boa prática para ser pego por um ErrorBoundary ou para debug
    // throw new Error(`Failed to fetch users: ${res.status} ${errorText}`);
    return []; // Retorna array vazio em caso de erro para não quebrar a renderização da UI
  }
  return res.json();
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  // Redireciona se não for admin
  if (session?.user?.role !== 'ADMIN') { // MODIFICADO AQUI
    redirect('/');
  }

  const users = await getUsersForAdmin();

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Painel do Administrador</h1>
      
      <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Gerenciar Usuários</h2>
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avatar</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verificado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  {/* Adicionar coluna de Role se desejar exibi-la */}
                  {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th> */}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.image ? (
                        <Image src={user.image} alt={user.name || 'Avatar'} width={40} height={40} className="rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.emailVerified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sim</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.whatsappLink || 'N/A'}</td>
                    {/* Exibir Role se adicionado à tabela */}
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role || 'N/A'}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                      <button className="text-red-600 hover:text-red-900">Deletar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhum usuário encontrado ou falha ao carregar.</p>
        )}
      </div>

      {/* Placeholder para Gerenciamento de Produtos */}
      <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-gray-800">Gerenciar Produtos</h2>
        <p className="text-sm text-gray-500">(Funcionalidade a ser implementada)</p>
      </div>

      {/* Placeholder para Gerenciamento de Reservas */}
      <div className="bg-white shadow-xl rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3 text-gray-800">Gerenciar Reservas</h2>
        <p className="text-sm text-gray-500">(Funcionalidade a ser implementada)</p>
      </div>
    </div>
  );
}