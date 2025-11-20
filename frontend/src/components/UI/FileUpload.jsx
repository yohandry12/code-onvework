import React, { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
  DocumentTextIcon,
  TrashIcon,
  UploadIcon,
} from "@heroicons/react/24/outline";

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: "0.75rem", // rounded-xl
  borderColor: "#e5e7eb", // border-gray-200
  borderStyle: "dashed",
  backgroundColor: "#fafafa", // bg-gray-50
  color: "#6b7280", // text-gray-500
  outline: "none",
  transition: "border .24s ease-in-out",
  height: "140px",
  cursor: "pointer",
};

const activeStyle = {
  borderColor: "#2563eb", // border-blue-500
  backgroundColor: "#eff6ff", // bg-blue-50
};

const FileUpload = ({ file, onFileChange, onFileRemove }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileChange(acceptedFiles[0]);
      }
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
    }),
    [isDragActive]
  );

  return (
    <div className="w-full">
      {/* Si aucun fichier n'est sélectionné, afficher la zone de drop */}
      {!file && (
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <UploadIcon className="w-10 h-10 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-center">
            <span className="font-semibold text-blue-600">
              Cliquez pour choisir
            </span>{" "}
            ou glissez-déposez
          </p>
          <p className="text-xs text-center">PDF, PNG, JPG (max. 5MB)</p>
        </div>
      )}

      {/* Si un fichier est sélectionné, afficher ses détails */}
      {file && (
        <div className="p-4 border rounded-lg bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {/* Si 'file' est un objet File, on prend son nom. Sinon, on affiche la chaîne. */}
                {typeof file === "object" && file.name
                  ? file.name
                  : String(file).split(/[\\/]/).pop()}
              </p>
              <p className="text-xs text-gray-500">
                {/* On affiche la taille uniquement si 'file' est un objet File */}
                {typeof file === "object" && file.size
                  ? `${(file.size / 1024).toFixed(2)} KB`
                  : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFileRemove}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <TrashIcon className="w-5 h-5 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
