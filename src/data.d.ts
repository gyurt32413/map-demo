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
