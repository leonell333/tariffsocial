# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Tariff Social

A social media platform built with React, Redux, and Firebase.

## Features

### Post Search Functionality

The application includes a comprehensive post search system that allows users to find posts based on their titles. Here's how it works:

#### Search Implementation

1. **Title Extraction**: The search uses the first line of each post as the title:
   - When creating a post, the first line is automatically extracted as the title
   - The title is stored separately in the database for efficient searching
   - This approach is much more efficient than searching through full post content

2. **Search Process**:
   - Users type in the search bar in the navbar
   - Search terms are processed and matched against post titles
   - The `searchPostsByKeywords` action queries Firebase and filters by title
   - Results are displayed in a dedicated search view

3. **Search Features**:
   - **Real-time search**: Results update as you type (with 1-second debounce)
   - **Pagination**: Load more results on scroll
   - **Search indicators**: Clear visual feedback when in search mode
   - **Clear search**: Easy way to return to normal feed
   - **No results handling**: Helpful message when no posts match
   - **Title-based**: Searches only post titles for better performance

4. **Database Structure**:
   - Posts have a dedicated `title` field extracted from the first line
   - Search uses client-side filtering for better performance
   - No complex keyword indexing required

#### Usage

1. Type in the search bar at the top of the page
2. Results appear automatically after 1 second
3. Scroll down to load more results
4. Click "Clear Search" to return to the normal feed
5. Apply filters or change sort to automatically clear search

#### Technical Details

- **Search Action**: `searchPostsByKeywords(keywordsArray, reset)`
- **Redux State**: `searchPosts`, `isSearchMode`, `lastSearchPost`, `lastSearchPostVisible`
- **Search Method**: Client-side filtering of post titles
- **Performance**: Much more efficient than full-content search
- **Title Extraction**: Automatic from first line of post content

## Getting Started

// ... existing content ...


