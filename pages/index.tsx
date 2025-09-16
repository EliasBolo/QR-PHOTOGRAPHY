import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>QR Photography</title>
        <meta name="description" content="QR Photography - Live your Wedding Experience" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="main">
        <div className="container">
          <h1 className="title">
            QR Photography
          </h1>
          <p className="tagline">
            Share your Moments
          </p>
          <div className="auth-buttons">
            <Link href="/login" className="btn">
              Login
            </Link>
            <Link href="/register" className="btn btn-primary">
              Register
            </Link>
          </div>
          <p className="copyright">
            Developed by CodeRunner2049 Studios, all Rights Reserved
          </p>
        </div>
      </main>
    </>
  )
}
