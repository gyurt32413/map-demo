const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ResponseData {
  result: ResultData[];
  tod: boolean;
}

interface ResultData {
  distance: number;
  id: number;
  is_tod: number;
  latitude: number;
  longitude: number;
  name: string;
  radius: number;
  stop_name: string;
}

/**
 * 取得附近的都更地點 API
 * @param lat number 緯度
 * @param lng number 經度
 */
export async function useFetchNearbyRenewal(lat: number, lng: number) {
  try {
    const url = `${API_BASE_URL}/calc-distance`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng }),
    });

    console.log("Request URL:", response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ResponseData = await response.json();
    console.log("API result:", result);
    return result;
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
