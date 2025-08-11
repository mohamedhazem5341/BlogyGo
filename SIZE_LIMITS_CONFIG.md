# Size Limits Configuration Guide

This document shows you exactly where to change all size limits in the blog application.

## 🖼️ Image Upload Size Limits

**File:** `server.js` (Line 57)
```javascript
fileSize: 20 * 1024 * 1024 // *** CHANGE THIS: 20MB per image limit - modify number before * 1024 * 1024 ***
```
**To change:** Replace `20` with your desired size in MB.
- Example: `50 * 1024 * 1024` = 50MB limit
- Example: `100 * 1024 * 1024` = 100MB limit

## 📄 Request Size Limits (Server)

**File:** `server.js` (Lines 14-15)
```javascript
app.use(express.json({ limit: '100mb' })); // JSON payload limit - change '100mb' to increase
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // Form data limit - change '100mb' to increase
```
**To change:** Replace `'100mb'` with your desired size.
- Example: `'200mb'` = 200MB limit
- Example: `'500mb'` = 500MB limit

## 📝 Topic Content Size Limits

### Server-side validation
**File:** `server.js` (Line 137)
```javascript
if (content.length > 500000) { // *** CHANGE THIS: 500KB limit for HTML content - modify this number ***
```
**To change:** Replace `500000` with your desired size in bytes.
- Example: `1000000` = 1MB limit
- Example: `2000000` = 2MB limit

### Client-side validation  
**File:** `posts/admin.html` (Line 410)
```javascript
if (topicData.content.length > 500000) {
    // *** CHANGE THIS: 500KB limit for HTML content - modify this number ***
```
**To change:** Replace `500000` with your desired size in bytes (should match server-side).

## 🎯 Quick Size Reference

| Size | Bytes | Common Usage |
|------|-------|--------------|
| 100KB | 100000 | Small text content |
| 500KB | 500000 | Medium text with formatting |
| 1MB | 1000000 | Large text content |
| 5MB | 5000000 | Very large content |
| 20MB | 20971520 | Large images |
| 50MB | 52428800 | Very large images |
| 100MB | 104857600 | Huge files |

## ⚠️ Important Notes

1. **Keep client and server limits matching:** Always update both client-side and server-side validation to the same values.

2. **Image vs Content limits:** Images are stored as separate files, so they don't count toward content size limits. Content limits are for the HTML text only.

3. **Memory considerations:** Very large limits (>100MB) may cause performance issues on smaller servers.

4. **Restart required:** After changing server.js, restart the server for changes to take effect.

## 🔧 How to Restart Server

Run this command in the terminal:
```bash
# The server will restart automatically in Replit workflows
```
Or restart the "Blog Server" workflow from the Replit interface.