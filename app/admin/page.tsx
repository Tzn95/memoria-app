"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Memorial = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  status: "draft" | "published";
  created_at: string;
};

const emptyForm = {
  first_name: "",
  last_name: "",
  birth_date: "",
  birth_place: "",
  death_date: "",
  death_place: "",
  dedication: "",
  short_intro: "",
  biography: "",
  cemetery_name: "",
  cemetery_address: "",
  cemetery_section: "",
  cemetery_row: "",
  cemetery_spot: "",
  maps_url: "",
  status: "draft",main_photo_url: "",
};

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

async function uploadMainPhoto(file: File) {
  try {
    setUploadingPhoto(true);
    setMessage("");

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `main-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("memorial-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("memorial-media")
      .getPublicUrl(filePath);

    setForm((current) => ({
      ...current,
      main_photo_url: data.publicUrl,
    }));

    setMessage("Foto principale caricata correttamente.");
  } catch (error) {
    console.error(error);
    setMessage(
      error instanceof Error
        ? `Errore caricamento foto: ${error.message}`
        : "Errore durante il caricamento della foto."
    );
  } finally {
    setUploadingPhoto(false);
  }
}
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [memorials, setMemorials] = useState<Memorial[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLogged(!!data.session);
      setLoading(false);

      if (data.session) {
        loadMemorials();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLogged(!!session);

      if (session) {
        loadMemorials();
      } else {
        setMemorials([]);
      }
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

  async function loadMemorials() {
    const { data, error } = await supabase
      .from("memorials")
      .select("id,slug,first_name,last_name,status,created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMemorials(data as Memorial[]);
    }
  }

  function updateField(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function makeSlug(firstName: string, lastName: string) {
    const base = `${firstName}-${lastName}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const unique = Math.random().toString(36).slice(2, 7);

    return `${base}-${unique}`;
  }

  async function createMemorial(e: React.FormEvent) {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setMessage("Inserisci almeno nome e cognome.");
      return;
    }

    setSaving(true);
    setMessage("");

    const slug = makeSlug(form.first_name, form.last_name);

    const payload = {
      slug,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      main_photo_url: form.main_photo_url || null,

      birth_date: form.birth_date || null,
      birth_place: form.birth_place.trim() || null,

      death_date: form.death_date || null,
      death_place: form.death_place.trim() || null,

      dedication: form.dedication.trim() || null,
      short_intro: form.short_intro.trim() || null,
      biography: form.biography.trim() || null,

      cemetery_name: form.cemetery_name.trim() || null,
      cemetery_address: form.cemetery_address.trim() || null,
      cemetery_section: form.cemetery_section.trim() || null,
      cemetery_row: form.cemetery_row.trim() || null,
      cemetery_spot: form.cemetery_spot.trim() || null,

      maps_url: form.maps_url.trim() || null,

      status: form.status,
    };

    const { data, error } = await supabase
      .from("memorials")
      .insert(payload)
      .select("id,slug,first_name,last_name,status,created_at")
      .single();

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage(
        "Non è stato possibile creare il memoriale. Controlla i permessi Supabase."
      );
      return;
    }

    setForm(emptyForm);
    setShowForm(false);

    if (data) {
      setMemorials((current) => [data as Memorial, ...current]);
    }

    setMessage(`Memoriale creato: ${data?.slug ?? slug}`);
  }

  if (loading) {
    return (
      <main className="page center">
        <p>Caricamento...</p>
      </main>
    );
  }

  if (!logged) {
    return (
      <main className="page center">
        <div className="loginBox">
          <div className="brand">MEMORIA</div>

          <h1>Area amministratore</h1>

          <p className="subtitle">
            Accedi per creare e gestire i memoriali.
          </p>

          <form onSubmit={login} className="form">
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

            <button className="primary" type="submit">
              Accedi
            </button>

            {message && <p className="error">{message}</p>}
          </form>
        </div>

        <Styles />
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <header className="topbar">
          <div>
            <div className="brand">MEMORIA</div>

            <h1>Gestione memoriali</h1>

            <p className="subtitle">
              Crea e gestisci le pagine commemorative.
            </p>
          </div>

          <button className="secondary" onClick={logout}>
            Esci
          </button>
        </header>

        {message && <div className="notice">{message}</div>}

        {!showForm && (
          <>
            <section className="actionCard">
              <div>
                <p className="eyebrow">NUOVO MEMORIALE</p>

                <h2>Crea una nuova pagina</h2>

                <p>
                  Inserisci i dati della persona. Il sistema creerà
                  automaticamente un indirizzo univoco per il memoriale.
                </p>
              </div>

              <button
                className="primary"
                onClick={() => {
                  setMessage("");
                  setShowForm(true);
                }}
              >
                + Nuovo memoriale
              </button>
            </section>

            <section className="listSection">
              <p className="eyebrow">MEMORIALI</p>
              <h2>Memoriali esistenti</h2>

              {memorials.length === 0 ? (
                <div className="empty">
                  Non ci sono ancora memoriali disponibili.
                </div>
              ) : (
                <div className="memorialList">
                  {memorials.map((memorial) => (
                    <article className="memorialCard" key={memorial.id}>
                      <div>
                        <strong>
                          {memorial.first_name} {memorial.last_name}
                        </strong>

                        <span>/m/{memorial.slug}</span>
                      </div>

                      <span
                        className={
                          memorial.status === "published"
                            ? "status published"
                            : "status"
                        }
                      >
                        {memorial.status === "published"
                          ? "Pubblicato"
                          : "Bozza"}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {showForm && (
          <section className="formCard">
            <button
              type="button"
              className="back"
              onClick={() => {
                setShowForm(false);
                setMessage("");
              }}
            >
              ← Torna ai memoriali
            </button>

            <p className="eyebrow">NUOVO MEMORIALE</p>

            <h2>Crea memoriale</h2>

            <p className="formIntro">
              I campi potranno essere modificati anche successivamente.
            </p>

            <form onSubmit={createMemorial} className="form">
              <div className="twoColumns">
                <Field
                  label="Nome *"
                  name="first_name"
                  value={form.first_name}
                  onChange={updateField}
                  required
                />

                <Field
                  label="Cognome *"
                  name="last_name"
                  value={form.last_name}
                  onChange={updateField}
                  required
                />
              </div>

              <div className="twoColumns">
                <Field
                  label="Data di nascita"
                  name="birth_date"
                  type="date"
                  value={form.birth_date}
                  onChange={updateField}
                />

                <Field
                  label="Luogo di nascita"
                  name="birth_place"
                  value={form.birth_place}
                  onChange={updateField}
                />
              </div>

              <div className="twoColumns">
                <Field
                  label="Data di morte"
                  name="death_date"
                  type="date"
                  value={form.death_date}
                  onChange={updateField}
                />

                <Field
                  label="Luogo di morte"
                  name="death_place"
                  value={form.death_place}
                  onChange={updateField}
                />
              </div>
              <label>Foto principale</label>

<input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  disabled={uploadingPhoto}
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) uploadMainPhoto(file);
  }}
/>

{uploadingPhoto && <p>Caricamento foto...</p>}

{form.main_photo_url && (
  <div style={{ marginBottom: "24px" }}>
    <img
      src={form.main_photo_url}
      alt="Anteprima foto principale"
      style={{
        width: "160px",
        height: "160px",
        objectFit: "cover",
        borderRadius: "12px",
        marginTop: "10px",
      }}
    />
    <p>Foto caricata ✓</p>
  </div>
)}

              <label>Frase commemorativa</label>

              <textarea
                name="dedication"
                value={form.dedication}
                onChange={updateField}
                rows={3}
                placeholder="Il tuo ricordo vivrà per sempre nei nostri cuori."
              />

              <label>Breve introduzione</label>

              <textarea
                name="short_intro"
                value={form.short_intro}
                onChange={updateField}
                rows={3}
                placeholder="Una breve presentazione della persona."
              />

              <label>Biografia</label>

              <textarea
                name="biography"
                value={form.biography}
                onChange={updateField}
                rows={8}
                placeholder="Racconta la sua storia, la famiglia, le passioni e i momenti importanti della sua vita."
              />

              <div className="sectionTitle">
                <p className="eyebrow">LUOGO DI RIPOSO</p>
                <h3>Cimitero e posizione</h3>
              </div>

              <Field
                label="Nome del cimitero"
                name="cemetery_name"
                value={form.cemetery_name}
                onChange={updateField}
              />

              <Field
                label="Indirizzo del cimitero"
                name="cemetery_address"
                value={form.cemetery_address}
                onChange={updateField}
              />

              <div className="threeColumns">
                <Field
                  label="Sezione"
                  name="cemetery_section"
                  value={form.cemetery_section}
                  onChange={updateField}
                />

                <Field
                  label="Fila"
                  name="cemetery_row"
                  value={form.cemetery_row}
                  onChange={updateField}
                />

                <Field
                  label="Tomba / posto"
                  name="cemetery_spot"
                  value={form.cemetery_spot}
                  onChange={updateField}
                />
              </div>

              <Field
                label="Link Google Maps"
                name="maps_url"
                type="url"
                value={form.maps_url}
                onChange={updateField}
                placeholder="https://..."
              />

              <label>Stato del memoriale</label>

              <select
                name="status"
                value={form.status}
                onChange={updateField}
              >
                <option value="draft">Bozza</option>
                <option value="published">Pubblicato</option>
              </select>

              <div className="formActions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  className="primary"
                  disabled={saving}
                >
                  {saving ? "Creazione..." : "Crea memoriale"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>

      <Styles />
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
      }

      .page {
        min-height: 100vh;
        background: #faf9f4;
        color: #171820;
        padding: 35px 20px 90px;
        font-family: Arial, Helvetica, sans-serif;
      }

      .center {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .container {
        width: 100%;
        max-width: 1050px;
        margin: 0 auto;
      }

      .loginBox {
        width: 100%;
        max-width: 430px;
      }

      .brand {
        font-weight: 700;
        letter-spacing: 4px;
        font-size: 15px;
        margin-bottom: 38px;
      }

      h1,
      h2,
      h3 {
        font-family: Georgia, "Times New Roman", serif;
        font-weight: 600;
      }

      h1 {
        font-size: 48px;
        line-height: 1.05;
        margin: 0 0 16px;
      }

      h2 {
        font-size: 36px;
        margin: 10px 0 15px;
      }

      h3 {
        font-size: 28px;
        margin: 8px 0 0;
      }

      .subtitle,
      .formIntro {
        color: #626269;
        font-size: 18px;
        line-height: 1.6;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 25px;
        margin-bottom: 50px;
      }

      .eyebrow {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 2px;
        margin: 0 0 10px;
      }

      .actionCard,
      .formCard,
      .listSection {
        background: #ffffff;
        border: 1px solid #dfddd5;
        padding: 32px;
        margin-bottom: 25px;
      }

      .actionCard {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 35px;
      }

      .actionCard p {
        max-width: 620px;
        font-size: 17px;
        line-height: 1.6;
        color: #5f6066;
      }

      button,
      input,
      textarea,
      select {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      .primary {
        border: 1px solid #171820;
        background: #171820;
        color: #ffffff;
        padding: 16px 21px;
        font-size: 16px;
        font-weight: 700;
      }

      .primary:disabled {
        opacity: 0.6;
      }

      .secondary {
        border: 1px solid #171820;
        background: transparent;
        color: #171820;
        padding: 13px 18px;
        font-size: 15px;
      }

      .notice {
        border: 1px solid #c9c6bc;
        background: #ffffff;
        padding: 16px 18px;
        margin-bottom: 22px;
        line-height: 1.5;
      }

      .error {
        color: #a32929;
        font-size: 15px;
      }

      .form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      label {
        display: block;
        font-weight: 700;
        font-size: 15px;
        margin-top: 10px;
        margin-bottom: 7px;
      }

      input,
      textarea,
      select {
        width: 100%;
        border: 1px solid #c9c7bf;
        background: #ffffff;
        color: #171820;
        padding: 15px 16px;
        border-radius: 3px;
        font-size: 17px;
      }

      textarea {
        resize: vertical;
        line-height: 1.55;
      }

      .field {
        width: 100%;
      }

      .twoColumns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
      }

      .threeColumns {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 18px;
      }

      .sectionTitle {
        margin-top: 35px;
        padding-top: 28px;
        border-top: 1px solid #e3e1da;
      }

      .formActions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 30px;
      }

      .back {
        border: 0;
        padding: 0;
        background: transparent;
        margin-bottom: 35px;
        font-size: 15px;
      }

      .memorialList {
        display: flex;
        flex-direction: column;
        margin-top: 25px;
      }

      .memorialCard {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 20px 0;
        border-top: 1px solid #e1dfd8;
      }

      .memorialCard strong {
        display: block;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 23px;
        margin-bottom: 7px;
      }

      .memorialCard span {
        color: #686970;
        font-size: 14px;
      }

      .status {
        display: inline-block;
        border: 1px solid #c9c7bf;
        padding: 7px 10px;
        white-space: nowrap;
      }

      .status.published {
        color: #285a3b;
        border-color: #9ab8a3;
      }

      .empty {
        margin-top: 25px;
        padding: 30px 0;
        border-top: 1px solid #e1dfd8;
        color: #686970;
      }

      @media (max-width: 700px) {
        .page {
          padding: 28px 18px 70px;
        }

        h1 {
          font-size: 39px;
        }

        h2 {
          font-size: 31px;
        }

        .topbar {
          flex-direction: column;
        }

        .actionCard {
          display: block;
          padding: 25px 20px;
        }

        .actionCard .primary {
          width: 100%;
          margin-top: 18px;
        }

        .formCard,
        .listSection {
          padding: 25px 20px;
        }

        .twoColumns,
        .threeColumns {
          grid-template-columns: 1fr;
          gap: 5px;
        }

        .formActions {
          flex-direction: column-reverse;
        }

        .formActions button {
          width: 100%;
        }

        .memorialCard {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `}</style>
  );
}
