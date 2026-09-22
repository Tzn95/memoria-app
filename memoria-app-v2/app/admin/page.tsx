"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLogged(!!data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLogged(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Email o password non corretti.");
      return;
    }

    setLogged(true);
  }

  async function logout() {
    await supabase.auth.signOut();
    setLogged(false);
  }

  if (loading) {
    return (
      <main className="adminPage">
        <p>Caricamento...</p>
      </main>
    );
  }

  if (!logged) {
    return (
      <main className="adminPage">
        <div className="loginBox">
          <div className="brand">MEMORIA</div>

          <h1>Area amministratore</h1>

          <p className="subtitle">
            Accedi per creare e gestire i memoriali.
          </p>

          <form onSubmit={login}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua email"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />

            <button type="submit">Accedi</button>

            {message && <p className="error">{message}</p>}
          </form>
        </div>

        <style jsx>{`
          .adminPage {
            min-height: 100vh;
            background: #faf9f4;
            color: #171820;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 28px;
            font-family: Arial, sans-serif;
          }

          .loginBox {
            width: 100%;
            max-width: 430px;
          }

          .brand {
            font-weight: 700;
            letter-spacing: 4px;
            margin-bottom: 50px;
          }

          h1 {
            font-family: Georgia, serif;
            font-size: 44px;
            line-height: 1.05;
            margin: 0 0 18px;
          }

          .subtitle {
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 40px;
            color: #55565c;
          }

          form {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          label {
            font-size: 16px;
            font-weight: 600;
            margin-top: 10px;
          }

          input {
            width: 100%;
            padding: 17px;
            border: 1px solid #c9c7bf;
            background: white;
            border-radius: 4px;
            font-size: 17px;
          }

          button {
            margin-top: 20px;
            border: 0;
            background: #171820;
            color: white;
            padding: 18px;
            border-radius: 4px;
            font-size: 17px;
            font-weight: 600;
            cursor: pointer;
          }

          .error {
            color: #a32929;
            margin-top: 12px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="adminPage">
      <div className="dashboard">
        <div>
          <div className="brand">MEMORIA</div>
          <h1>Gestione memoriali</h1>

          <p className="subtitle">
            Area amministrativa protetta.
          </p>
        </div>

        <button onClick={logout}>Esci</button>
      </div>

      <section className="panel">
        <p className="eyebrow">MEMORIALI</p>

        <h2>Crea e gestisci i memoriali</h2>

        <p>
          Il prossimo passaggio sarà il modulo per creare un nuovo memoriale,
          caricare le fotografie e generare il relativo indirizzo permanente.
        </p>

        <button className="primary">+ Nuovo memoriale</button>
      </section>

      <style jsx>{`
        .adminPage {
          min-height: 100vh;
          background: #faf9f4;
          color: #171820;
          padding: 32px 22px 80px;
          font-family: Arial, sans-serif;
        }

        .dashboard {
          max-width: 1000px;
          margin: auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .brand {
          font-weight: 700;
          letter-spacing: 4px;
          margin-bottom: 35px;
        }

        h1 {
          font-family: Georgia, serif;
          font-size: 46px;
          margin: 0;
        }

        .subtitle {
          font-size: 18px;
          color: #666;
        }

        button {
          border: 1px solid #171820;
          background: transparent;
          padding: 13px 18px;
          font-size: 16px;
          cursor: pointer;
        }

        .panel {
          max-width: 1000px;
          margin: 60px auto 0;
          background: white;
          padding: 35px;
          border: 1px solid #e0ded7;
        }

        .eyebrow {
          font-size: 13px;
          letter-spacing: 2px;
          font-weight: 700;
        }

        h2 {
          font-family: Georgia, serif;
          font-size: 34px;
          margin: 18px 0;
        }

        .panel p {
          font-size: 18px;
          line-height: 1.6;
        }

        .primary {
          margin-top: 25px;
          background: #171820;
          color: white;
          padding: 17px 22px;
        }

        @media (max-width: 600px) {
          h1 {
            font-size: 38px;
          }

          .dashboard {
            flex-direction: column;
          }

          .panel {
            padding: 25px 20px;
          }
        }
      `}</style>
    </main>
  );
}
