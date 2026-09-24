import { useState } from 'react';
import type { ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNativeApp } from '@/lib/platform';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:application/pdf;base64," prefix - Capacitor
      // Filesystem wants the raw base64 payload only.
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface Props {
  // Named "document" to match @react-pdf/renderer's own convention
  // (and PDFDownloadLink's prop of the same name) - the web-download
  // branch below uses window.document explicitly to avoid shadowing it.
  document: ReactElement;
  fileName: string;
  label?: string;
  className?: string;
}

export function SavePdfButton({ document: pdfDocument, fileName, label = 'Download PDF', className }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const blob = await pdf(pdfDocument).toBlob();

      if (isNativeApp()) {
        const base64 = await blobToBase64(blob);
        const written = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
        await Share.share({ title: fileName, url: written.uri });
      } else {
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = fileName;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate the PDF.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className={className ?? 'inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60'}>
        {loading ? 'Preparing PDF…' : label}
      </button>
      {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
    </div>
  );
}
