"use client";

import { useRef, useState, useTransition } from "react";
import { updateAvatar } from "@/lib/actions/profile";
import { getInitials } from "@/lib/utils/initials";
import { calculateCropDimensions } from "@/lib/utils/image";

interface AvatarUploaderProps {
  currentAvatarUrl: string | null;
  userName: string | null;
  userEmail: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2_097_152; // 2 MB
const OUTPUT_SIZE = 256;

export function AvatarUploader({
  currentAvatarUrl,
  userName,
  userEmail,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);

  const initials = getInitials(userName, userEmail);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous error on new attempt
    setError(null);

    // Validate MIME type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato aceito: JPEG, PNG ou WebP");
      // Reset input so user can re-select same file
      e.target.value = "";
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      setError("Imagem deve ter no máximo 2 MB");
      e.target.value = "";
      return;
    }

    // Process image
    processImage(file);
    e.target.value = "";
  }

  function processImage(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = OUTPUT_SIZE;
          canvas.height = OUTPUT_SIZE;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            setError("Erro ao salvar foto. Tente novamente.");
            return;
          }

          const { sx, sy, sWidth, sHeight } = calculateCropDimensions(
            img.width,
            img.height
          );

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

          // Update preview immediately for responsiveness
          setPreviewUrl(dataUrl);

          startTransition(async () => {
            const result = await updateAvatar({ avatarUrl: dataUrl });
            if (!result.success) {
              setError(result.error);
              // Revert preview on failure
              setPreviewUrl(currentAvatarUrl);
            }
          });
        } catch {
          setError("Erro ao salvar foto. Tente novamente.");
        }
      };

      img.onerror = () => {
        setError("Erro ao salvar foto. Tente novamente.");
      };

      img.src = reader.result as string;
    };

    reader.onerror = () => {
      setError("Erro ao salvar foto. Tente novamente.");
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="avatar-uploader">
      <button
        type="button"
        className="avatar-uploader__area"
        onClick={handleClick}
        aria-label="Alterar foto de perfil"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Foto de perfil"
            className="avatar-uploader__image"
          />
        ) : (
          <span className="avatar-uploader__initials">{initials}</span>
        )}

        {isPending && (
          <div className="avatar-uploader__loading" aria-label="Processando imagem">
            <svg
              className="avatar-uploader__spinner"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
              />
            </svg>
          </div>
        )}

        <span className="avatar-uploader__hint">📷</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="avatar-uploader__input"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p className="avatar-uploader__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
