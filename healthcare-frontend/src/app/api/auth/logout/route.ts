import { NextResponse } from 'next/server';

export async function GET() {
  // Return a response that will instruct the client to:
  // 1. Clear Firebase auth state
  // 2. Clear localStorage and sessionStorage via script
  // 3. Redirect to login page
  
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Logging out...</title>
        <script>
          // Function to completely sign out of Firebase
          async function completeSignOut() {
            try {
              // If Firebase Auth is available, sign out directly
              if (window.firebase && window.firebase.auth) {
                await window.firebase.auth().signOut();
              }
              
              // Clear IndexedDB for Firebase
              const dbs = await window.indexedDB.databases();
              dbs.forEach(db => {
                if (db.name && db.name.includes('firebase')) {
                  window.indexedDB.deleteDatabase(db.name);
                }
              });

              // Clear all local storage
              window.localStorage.clear();
              
              // Remove specific Firebase items
              window.localStorage.removeItem('firebase:auth:user');
              window.localStorage.removeItem('firebase:authUser');
              window.localStorage.removeItem('firebase:persistence');
              window.localStorage.removeItem('firebase:forceRefresh');
              
              // Clear session storage
              window.sessionStorage.clear();
              
              // Clear cookies
              document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
              });
              
              // Finally redirect to login page after a small delay
              // to ensure everything is properly cleared
              setTimeout(() => {
                window.location.href = '/login?signedOut=true';
              }, 300);
            } catch (error) {
              console.error('Error during sign out:', error);
              // Redirect anyway
              window.location.href = '/login?signedOut=true';
            }
          }
          
          // Execute the sign out
          completeSignOut();
        </script>
      </head>
      <body>
        <h1>Logging out...</h1>
        <p>Please wait while we securely log you out.</p>
      </body>
    </html>
    `,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    }
  );
}
