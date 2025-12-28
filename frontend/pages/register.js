import Head from 'next/head'
import Header from '../components/Header'
import RegisterForm from '../components/RegisterForm'

export default function Register() {
  return (
    <>
      <Head>
        <title>Rejestracja - VCV Rack Patches</title>
        <meta name="description" content="Zarejestruj się w archiwum patchy VCV Rack" />
      </Head>

      <Header />

      <main>
        <RegisterForm />
      </main>
    </>
  )
}
