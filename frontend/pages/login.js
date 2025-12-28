import Head from 'next/head'
import Header from '../components/Header'
import LoginForm from '../components/LoginForm'

export default function Login() {
  return (
    <>
      <Head>
        <title>Logowanie - VCV Rack Patches</title>
        <meta name="description" content="Zaloguj się do archiwum patchy VCV Rack" />
      </Head>

      <Header />

      <main>
        <LoginForm />
      </main>
    </>
  )
}
