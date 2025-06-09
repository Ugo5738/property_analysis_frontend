import floorplanAxios from '../utils/floorplanAxiosConfig';

/**
 * Get a list of properties
 * @param userId Optional user ID to filter properties
 * @param page Page number for pagination
 * @param pageSize Number of items per page
 */
export const listProperties = async (userId?: string, page: number = 1, pageSize: number = 10) => {
  try {
    let queryParams = new URLSearchParams();
    
    if (userId) {
      queryParams.append('user_id', userId);
    }
    
    queryParams.append('page', page.toString());
    queryParams.append('page_size', pageSize.toString());
    
    const response = await floorplanAxios.get(`/properties/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific property
 * @param propertyId Property ID to retrieve
 * @param userId Optional user ID to ensure property belongs to specified user
 */
export const getPropertyDetail = async (propertyId: string, userId?: string) => {
  try {
    let queryParams = new URLSearchParams();
    
    if (userId) {
      queryParams.append('user_id', userId);
    }
    
    const response = await floorplanAxios.get(
      `/properties/${propertyId}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error);
    throw error;
  }
};

/**
 * Get detailed information for a specific floor plan
 * @param floorplanId Floorplan ID to retrieve
 * @param propertyId Optional property ID to ensure floor plan belongs to specified property
 */
export const getFloorplanDetail = async (floorplanId: string, propertyId?: string) => {
  try {
    let queryParams = new URLSearchParams();
    
    if (propertyId) {
      queryParams.append('property_id', propertyId);
    }
    
    const response = await floorplanAxios.get(
      `/floorplans/${floorplanId}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching floorplan ${floorplanId}:`, error);
    throw error;
  }
};

export default {
  listProperties,
  getPropertyDetail,
  getFloorplanDetail,
};
