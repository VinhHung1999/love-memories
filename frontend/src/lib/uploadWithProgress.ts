const TOKEN_KEY = 'love-scrum-token';

export function uploadWithProgress(
  url: string,
  formData: FormData,
  token: string | null,
  onProgress?: (percent: number) => void,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.timeout = 300_000; // 5 minutes
    xhr.ontimeout = () => reject(new Error('Upload timeout — file quá lớn hoặc mạng chậm, vui lòng thử lại'));

    xhr.onload = () => {
      if (xhr.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
        reject(new Error('Unauthorized'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body?.error || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        reject(new Error('Invalid response'));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(formData);
  });
}
