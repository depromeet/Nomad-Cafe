import { useState, useCallback, useEffect } from "react";
import GeoLocationUtils from "../utils/GeoLocationUtils";

const useGeoLocation = () => {
  const [currentCoordinates, setCurrentCoordinates] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setIsFetching(true);
    try {
      const coords = await GeoLocationUtils.getGeoLocation();
      const addressName = await GeoLocationUtils.getAddressByCoordinates(coords);
      setCurrentCoordinates(coords);
      setCurrentAddress(addressName);
    } catch (err) {
      console.error(err);
      setError(err);
    }
    setIsFetching(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    currentCoordinates,
    currentAddress,
    fetch,
    isFetching,
    error,
  };
};

export default useGeoLocation;
