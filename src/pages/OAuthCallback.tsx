import * as React from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * This route runs INSIDE THE POPUP on our own domain.
 * It posts a success/error message to the opener and closes.
 */
export default function OAuthCallback() {
  const [sp] = useSearchParams();
  const provider = sp.get('provider') || 'unknown';
  const status   = sp.get('status')   || 'error';
  const error    = sp.get('error')    || null;
  const properties = sp.get('properties');
  const sites = sp.get('sites');
  const locations = sp.get('locations');

  React.useEffect(() => {
    let payload: any = { type: 'oauth:callback', provider, status, error };
    
    // Handle GA4 specific data
    if (provider === 'ga4' && status === 'success' && properties) {
      try {
        const parsedProperties = JSON.parse(decodeURIComponent(properties));
        console.log('OAuthCallback: GA4 properties parsed successfully:', parsedProperties.length);
        console.log('OAuthCallback: Sample property:', parsedProperties[0]);
        payload = {
          type: 'GA4_AUTH_SUCCESS',
          properties: parsedProperties
        };
      } catch (err) {
        console.error('OAuthCallback: Failed to parse GA4 properties:', err);
        payload = { type: 'GA4_AUTH_ERROR', error: 'Failed to parse properties' };
      }
    }
    
    // Handle GSC specific data
    if (provider === 'gsc' && status === 'success' && sites) {
      try {
        const parsedSites = JSON.parse(decodeURIComponent(sites));
        payload = {
          type: 'GSC_AUTH_SUCCESS',
          sites: parsedSites
        };
        console.log('OAuthCallback: GSC success with sites:', parsedSites.length);
      } catch (err) {
        console.error('OAuthCallback: Failed to parse GSC sites:', err);
        payload = { type: 'GSC_AUTH_ERROR', error: 'Failed to parse sites' };
      }
    }
    
    // Handle GBP specific data
    if (provider === 'gbp' && status === 'success' && locations) {
      try {
        const parsedLocations = JSON.parse(decodeURIComponent(locations));
        payload = {
          type: 'GBP_AUTH_SUCCESS',
          locations: parsedLocations
        };
        console.log('OAuthCallback: GBP success with locations:', parsedLocations.length);
      } catch (err) {
        console.error('OAuthCallback: Failed to parse GBP locations:', err);
        payload = { type: 'GBP_AUTH_ERROR', error: 'Failed to parse locations' };
      }
    }
    
    // Post only to our origin for safety:
    if (window.opener) {
      console.log('OAuthCallback: Posting message to parent:', payload);
      window.opener.postMessage(payload, window.location.origin);
    }
    // Close popup quickly
    window.close();
  }, [provider, status, error, properties, sites, locations]);

  return <div style={{ padding: 16 }}>You can close this window.</div>;
}