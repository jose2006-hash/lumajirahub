/**
 * InstallBanner — banner flotante en la parte inferior que aparece
 * cuando la PWA es instalable y no ha sido descartado por el usuario.
 */
export default function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="install-banner">
      <div className="install-banner-icon">📲</div>
      <div className="install-banner-text">
        <div className="install-banner-title">Instala LumajiraHub</div>
        <div className="install-banner-sub">
          Accede rápido desde tu pantalla de inicio, sin el navegador.
        </div>
      </div>
      <button className="btn-install btn-sm" onClick={onInstall}>
        Instalar
      </button>
      <button className="install-banner-close" onClick={onDismiss} title="Cerrar">
        ✕
      </button>
    </div>
  );
}
