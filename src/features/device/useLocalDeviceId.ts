import { useEffect, useState } from 'react';
import { getLocalDeviceId } from './deviceId';

export function useLocalDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    void getLocalDeviceId().then(setDeviceId);
  }, []);

  return deviceId;
}
