import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Pastelería Dulce Vicio</h3>
          <p>
            Elaboración artesanal de tortas y postres finos. Calidad, frescura y cumplimiento normativo garantizado.
          </p>
        </div>

        <div className="footer-section">
          <h3>Contacto</h3>
          <p>📍 Av. de Mayo 800, CABA, Argentina</p>
          <p>📞 +54 11 5555-4321</p>
          <p>✉️ hola@dulcevicio.com.ar</p>
        </div>

        <div
          className="footer-section"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <h3>Defensa del Consumidor</h3>
          {/* Enlace que dice exactamente "Botón de arrepentimiento" y apunta a /arrepentimiento */}
          <Link
            to="/arrepentimiento"
            className="btn btn-secondary"
            style={{
              width: "auto",
              padding: "0.6rem 1.2rem",
              borderColor: "#ebd5db",
              color: "#ebd5db",
              textDecoration: "none",
              display: "inline-block",
            }}
            id="btn-link-arrepentimiento"
          >
            Botón de arrepentimiento
          </Link>
          <p style={{ fontSize: "0.8rem", color: "#ccc", margin: 0 }}>
            Conforme a la Ley N° 24.240 (Art. 34) y Disposición 954/2025.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Dulce Vicio. Todos los derechos reservados.</p>
        <p>
          Dirección Nacional de Defensa del Consumidor y Arbitraje del Consumo. Para reclamos ingresá{" "}
          <a
            href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "white", textDecoration: "underline" }}
          >
            aquí
          </a>.
        </p>
      </div>
    </footer>
  );
}
