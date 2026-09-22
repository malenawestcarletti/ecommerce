import React, { useState, useRef, useEffect } from "react";
import { subirImagen } from "../services/api";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export default function SubirImagen({ productoId, onSuccess, onCancel }) {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Referencia NO controlada al input de archivos para poder limpiarlo tras éxito o error
  const fileInputRef = useRef(null);

  // Limpieza de memoria: Revoca la ObjectURL al cambiar de preview o al desmontar el componente
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const limpiarInputYEstado = () => {
    setArchivo(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSeleccionarArchivo = (e) => {
    setError(null);
    setMensajeExito(null);

    const file = e.target.files?.[0];
    if (!file) {
      limpiarInputYEstado();
      return;
    }

    // 1. Validación de tipo MIME en cliente (debe ser imagen)
    if (!file.type || !file.type.startsWith("image/")) {
      setError("El archivo seleccionado no es una imagen válida.");
      limpiarInputYEstado();
      return;
    }

    // 2. Validación de tamaño en cliente (estrictamente menor a 2 MB)
    if (file.size >= MAX_BYTES) {
      setError("El archivo excede el tamaño máximo permitido de 2 MB.");
      limpiarInputYEstado();
      return;
    }

    // Archivo válido: Guardar en estado y generar Vista Previa
    setArchivo(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleSubir = async (e) => {
    e.preventDefault();
    if (!archivo || subiendo) return;

    setSubiendo(true);
    setError(null);
    setMensajeExito(null);

    try {
      const productoActualizado = await subirImagen(productoId, archivo);
      setMensajeExito("¡Imagen subida correctamente!");

      // Limpieza de estado, preview y campo del input tras finalizar exitosamente
      limpiarInputYEstado();

      if (onSuccess) {
        onSuccess(productoActualizado);
      }
    } catch (err) {
      setError(err.message || "Error al subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="subir-imagen-card" style={{ marginTop: "1rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px dashed var(--color-border)" }}>
      <form onSubmit={handleSubir}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label
            htmlFor={`file-input-${productoId}`}
            style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem", color: "var(--color-text)" }}
          >
            📷 Cargar Foto del Producto (JPG, PNG o WebP &lt; 2 MB):
          </label>
          <input
            id={`file-input-${productoId}`}
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleSeleccionarArchivo}
            disabled={subiendo}
            style={{ fontSize: "0.85rem", width: "100%" }}
          />
        </div>

        {/* Vista Previa de la Imagen */}
        {preview && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", padding: "0.5rem", background: "#fff", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            <div style={{ width: "64px", height: "64px", overflow: "hidden", borderRadius: "6px", flexShrink: 0 }} className="aspect-square">
              <img
                src={preview}
                alt="Vista previa"
                className="object-cover"
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-light)" }}>
              <strong style={{ color: "var(--color-text)", display: "block" }}>{archivo?.name}</strong>
              <span>{(archivo?.size ? archivo.size / 1024 : 0).toFixed(1)} KB</span>
            </div>
          </div>
        )}

        {/* Mensajes de Error y Éxito */}
        {error && (
          <p style={{ color: "var(--color-error)", fontSize: "0.85rem", margin: "0.4rem 0", fontWeight: "500" }} role="alert">
            ⚠️ {error}
          </p>
        )}

        {mensajeExito && (
          <p style={{ color: "var(--color-success)", fontSize: "0.85rem", margin: "0.4rem 0", fontWeight: "500" }} role="status">
            ✨ {mensajeExito}
          </p>
        )}

        {/* Botones de Acción */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn"
            disabled={!archivo || subiendo}
            id={`btn-subir-imagen-${productoId}`}
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
              width: "auto",
              cursor: !archivo || subiendo ? "not-allowed" : "pointer",
            }}
          >
            {subiendo ? "Subiendo..." : "Subir Imagen"}
          </button>

          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={subiendo}
              style={{ padding: "0.45rem 0.8rem", fontSize: "0.85rem", width: "auto" }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
