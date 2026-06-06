const axios = require('axios');
require('dotenv').config();

// JSearch API configuration from RapidAPI
const rapidApiKey = process.env.RAPIDAPI_KEY;
const rapidApiHost = "jsearch.p.rapidapi.com";

/**
 * Searches for jobs using JSearch API
 * @param {string} query The job search query
 * @param {string} location The location to search in
 * @returns {Array} List of job objects
 */
async function searchJobs(query, location) {
    if (!rapidApiKey) {
        throw new Error("Missing RAPIDAPI_KEY in .env file");
    }

    const options = {
        method: 'GET',
        url: `https://${rapidApiHost}/search`,
        params: {
            query: `${query} in ${location}`,
            page: '1',
            num_pages: '1', // Start with 1 page to save API quota
            date_posted: 'all' // Traemos todas las fechas posibles para la prueba
        },
        headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': rapidApiHost
        }
    };

    try {
        const response = await axios.request(options);
        console.log("JSearch Response Metadata:", {
            status: response.status,
            request_id: response.data.request_id,
            data_length: response.data.data ? response.data.data.length : 'undefined'
        });
        if (!response.data.data || response.data.data.length === 0) {
             console.log("Raw Response Data:", JSON.stringify(response.data, null, 2));
        }
        return response.data.data || []; // JSearch returns jobs inside a 'data' array
    } catch (error) {
        console.error("Error searching jobs with JSearch:", error);
        return [];
    }
}

module.exports = { searchJobs };
