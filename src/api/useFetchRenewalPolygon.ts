const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * 取得附近的都更地點 API
 * @param directory string 目錄（目前只能輸入 tucheng.json）
 */
export async function useFetchRenewalPolygon(directory: string) {
  try {
    const url = `${API_BASE_URL}/geolocation-json?directory=${directory}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: PolygonResponseData = await response.json();
    return result;
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
