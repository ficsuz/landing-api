export const defaultCustomJsStr = `
      // Custom JavaScript for Swagger UI to automatically handle authentication tokens
      (function() {
          'use strict';

          // Wait for Swagger UI to be fully loaded
          function waitForSwaggerUI(callback) {
              if (window.ui && window.ui.getSystem) {
                  callback();
              } else {
                  setTimeout(() => waitForSwaggerUI(callback), 100);
              }
          }

          // Function to set bearer token in Swagger UI
          function setBearerToken(token) {
              try {
                  if (window.ui && window.ui.authActions) {
                      // Set the authorization header
                      window.ui.authActions.authorize({
                          authorization: {
                              name: 'authorization',
                              schema: {
                                  type: 'http',
                                  scheme: 'bearer'
                              },
                              value: token
                          }
                      });
                      
                      console.log('✅ Bearer token automatically set in Swagger UI');
                      
                      // Fetch user info after setting token
                      fetchUserInfo(token);
                      
                      // Show success notification
                      showNotification('🔐 Authentication successful! Token automatically applied to all requests.', 'success');
                  }
              } catch (error) {
                  console.error('Failed to set bearer token:', error);
                  showNotification('❌ Failed to automatically set token. Please set it manually.', 'error');
              }
          }

          // Function to fetch and display user information
          function fetchUserInfo(token) {
              const baseUrl = window.location.origin;
              fetch(\`\${baseUrl}/api/v1/users/me\`, {
                  method: 'GET',
                  headers: {
                      'Authorization': \`Bearer \${token}\`,
                      'Accept': 'application/json'
                  }
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success && data.data) {
                      displayUserInfo(data.data);
                  } else {
                      console.warn('Failed to fetch user info:', data);
                  }
              })
              .catch(error => {
                  console.error('Error fetching user info:', error);
              });
          }

          // Function to display user information at the top of Swagger UI
          function displayUserInfo(user) {
              // Remove existing user info if present
              const existingUserInfo = document.getElementById('swagger-user-info');
              if (existingUserInfo) {
                  existingUserInfo.remove();
              }

              // Create user info container
              const userInfoContainer = document.createElement('div');
              userInfoContainer.id = 'swagger-user-info';
              userInfoContainer.style.cssText = \`
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 15px 20px;
                  margin: 0;
                  border-bottom: 3px solid #4f46e5;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  position: sticky;
                  top: 0;
                  z-index: 1000;
              \`;

              // Create user info content
              const userRole = user.roles && user.roles.length > 0 ? user.roles[0].name : user.role || 'user';
              const roleColor = getRoleColor(userRole);
              
              userInfoContainer.innerHTML = \`
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                      <div style="display: flex; align-items: center; gap: 15px;">
                          <div style="
                              width: 40px; 
                              height: 40px; 
                              border-radius: 50%; 
                              background: rgba(255,255,255,0.2); 
                              display: flex; 
                              align-items: center; 
                              justify-content: center; 
                              font-weight: bold; 
                              font-size: 16px;
                          ">
                              \${user.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
                          </div>
                          <div>
                              <div style="font-weight: 600; font-size: 16px; margin-bottom: 2px;">
                                  \${user.firstName || ''} \${user.lastName || ''}
                              </div>
                              <div style="opacity: 0.9; font-size: 14px;">
                                  \${user.email}
                              </div>
                          </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 15px;">
                          <div style="
                              background: \${roleColor}; 
                              color: white; 
                              padding: 4px 12px; 
                              border-radius: 20px; 
                              font-size: 12px; 
                              font-weight: 600; 
                              text-transform: uppercase;
                          ">
                              \${userRole.replace('_', ' ')}
                          </div>
                          <div style="
                              background: \${user.isVerified ? '#10b981' : '#f59e0b'}; 
                              color: white; 
                              padding: 4px 8px; 
                              border-radius: 12px; 
                              font-size: 11px; 
                              font-weight: 500;
                          ">
                              \${user.isVerified ? '✓ Verified' : '⚠ Unverified'}
                          </div>
                          <button onclick="clearUserInfo()" style="
                              background: rgba(255,255,255,0.2); 
                              border: 1px solid rgba(255,255,255,0.3); 
                              color: white; 
                              padding: 6px 12px; 
                              border-radius: 6px; 
                              cursor: pointer; 
                              font-size: 12px;
                              transition: all 0.2s;
                          " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                              Logout
                          </button>
                      </div>
                  </div>
              \`;

              // Insert at the top of the page
              const swaggerContainer = document.querySelector('.swagger-ui') || document.body;
              swaggerContainer.insertBefore(userInfoContainer, swaggerContainer.firstChild);
              
              console.log('👤 User info displayed:', user);
          }

          // Function to get role color
          function getRoleColor(role) {
              const roleColors = {
                  'super_admin': '#dc2626',
                  'admin': '#ea580c', 
                  'manager': '#d97706',
                  'user': '#059669',
                  'guest': '#6b7280'
              };
              return roleColors[role] || '#6366f1';
          }

          // Function to clear user info and logout
          window.clearUserInfo = function() {
              const userInfoContainer = document.getElementById('swagger-user-info');
              if (userInfoContainer) {
                  userInfoContainer.remove();
              }
              
              // Clear authorization in Swagger UI
              if (window.ui && window.ui.authActions) {
                  window.ui.authActions.logout(['authorization']);
              }
              
              // Clear saved token from localStorage
              localStorage.removeItem('swagger_auth_token');
              localStorage.removeItem('swagger_auth_source');
              
              showNotification('👋 Logged out successfully', 'info');
          };


          // Function to show notification
          function showNotification(message, type = 'info') {
              // Create notification element
              const notification = document.createElement('div');
              notification.style.cssText = \`
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  padding: 12px 20px;
                  border-radius: 6px;
                  color: white;
                  font-weight: 500;
                  z-index: 10000;
                  max-width: 400px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  transition: all 0.3s ease;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              \`;
              
              // Set background color based on type
              switch(type) {
                  case 'success':
                      notification.style.backgroundColor = '#10b981';
                      break;
                  case 'error':
                      notification.style.backgroundColor = '#ef4444';
                      break;
                  default:
                      notification.style.backgroundColor = '#3b82f6';
              }
              
              notification.textContent = message;
              document.body.appendChild(notification);
              
              // Remove notification after 5 seconds
              setTimeout(() => {
                  notification.style.opacity = '0';
                  notification.style.transform = 'translateX(100%)';
                  setTimeout(() => {
                      if (notification.parentNode) {
                          notification.parentNode.removeChild(notification);
                      }
                  }, 300);
              }, 5000);
          }

          // Function to intercept fetch requests
          function interceptFetch() {
              const originalFetch = window.fetch;
              
              window.fetch = function(...args) {
                  const [url, options = {}] = args;
                  
                  // Check if this is a login request
                  if (url.includes('/auth/login') && options.method === 'POST') {
                      console.log('🔍 Login request detected, preparing to intercept response...');
                      
                      return originalFetch.apply(this, args)
                          .then(response => {
                              // Clone the response so we can read it without consuming it
                              const clonedResponse = response.clone();
                              
                              if (response.ok && (response.status === 200 || response.status === 201)) {
                                  clonedResponse.json()
                                      .then(data => {
                                          console.log('📥 Login response received:', data);
                                          
                                          // Extract access token from different possible response structures
                                          let accessToken = null;
                                          
                                          if (data.data && data.data.accessToken) {
                                              // If response is wrapped in a data object
                                              accessToken = data.data.accessToken;
                                          } else if (data.accessToken) {
                                              // If accessToken is directly in response
                                              accessToken = data.accessToken;
                                          } else if (data.access_token) {
                                              // Alternative naming convention
                                              accessToken = data.access_token;
                                          }
                                          
                                          if (accessToken) {
                                              console.log('🎯 Access token found, setting in Swagger UI...');
                                              // Small delay to ensure Swagger UI is ready
                                              setTimeout(() => {
                                                  setBearerTokenEnhanced(accessToken);
                                              }, 500);
                                          } else {
                                              console.warn('⚠️ No access token found in login response');
                                              showNotification('⚠️ Login successful but no token found in response', 'error');
                                          }
                                      })
                                      .catch(error => {
                                          console.error('Failed to parse login response:', error);
                                      });
                              }
                              
                              return response;
                          })
                          .catch(error => {
                              console.error('Login request failed:', error);
                              return Promise.reject(error);
                          });
                  }
                  
                  // For all other requests, proceed normally
                  return originalFetch.apply(this, args);
              };
          }

          // Function to check for existing token and load user info
          function checkExistingAuth() {
              try {
                  // First check if there's an existing authorization in Swagger UI
                  let existingToken = null;
                  
                  if (window.ui && window.ui.authSelectors) {
                      const authSelectors = window.ui.authSelectors;
                      const auths = authSelectors.authorized();
                      
                      if (auths && auths.get && auths.get('authorization')) {
                          const authData = auths.get('authorization');
                          if (authData && authData.get && authData.get('value')) {
                              existingToken = authData.get('value');
                              console.log('🔍 Found existing token in Swagger UI, fetching user info...');
                              fetchUserInfo(existingToken);
                              return true;
                          }
                      }
                  }
                  
                  // If no token in Swagger UI, check localStorage for saved token
                  const savedToken = localStorage.getItem('swagger_auth_token');
                  if (savedToken) {
                      console.log('🔍 Found saved token in localStorage, restoring...');
                      
                      // Restore token to Swagger UI without validation first
                      if (window.ui && window.ui.authActions) {
                          window.ui.authActions.authorize({
                              authorization: {
                                  name: 'authorization',
                                  schema: {
                                      type: 'http',
                                      scheme: 'bearer'
                                  },
                                  value: savedToken
                              }
                          });
                          console.log('🔄 Token restored to Swagger UI from localStorage');
                      }
                      
                      // Then validate and fetch user info
                      validateAndSetToken(savedToken);
                      return true;
                  }
                  
                  return false;
              } catch (error) {
                  console.error('Error checking existing auth:', error);
                  return false;
              }
          }

          // Function to validate token and set if valid
          function validateAndSetToken(token) {
              const baseUrl = window.location.origin;
              fetch(\`\${baseUrl}/api/v1/users/me\`, {
                  method: 'GET',
                  headers: {
                      'Authorization': \`Bearer \${token}\`,
                      'Accept': 'application/json'
                  }
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success && data.data) {
                      // Token is valid, set it in Swagger UI
                      if (window.ui && window.ui.authActions) {
                          window.ui.authActions.authorize({
                              authorization: {
                                  name: 'authorization',
                                  schema: {
                                      type: 'http',
                                      scheme: 'bearer'
                                  },
                                  value: token
                              }
                          });
                      }
                      displayUserInfo(data.data);
                      console.log('✅ Token validated and user info restored');
                  } else {
                      // Keep the saved token if this check is inconclusive — a page
                      // refresh must never log the user out. Use the Logout button
                      // to clear the token intentionally.
                      console.warn('⚠️ Could not validate saved token; keeping it.');
                  }
              })
              .catch(error => {
                  // Network/validation error: keep the token so a refresh does not
                  // wipe a still-valid session.
                  console.error('Error validating token (keeping it):', error);
              });
          }

          // Function to check if there's a manually set token
          function checkExistingManualToken() {
              try {
                  if (window.ui && window.ui.authSelectors) {
                      const authSelectors = window.ui.authSelectors;
                      const auths = authSelectors.authorized();
                      
                      if (auths && auths.get && auths.get('authorization')) {
                          const authData = auths.get('authorization');
                          if (authData && authData.get && authData.get('value')) {
                              const currentToken = authData.get('value');
                              const tokenSource = localStorage.getItem('swagger_auth_source');
                              
                              // If token exists but wasn't set by login, it's manual
                              if (currentToken && tokenSource !== 'login') {
                                  return currentToken;
                              }
                          }
                      }
                  }
                  return null;
              } catch (error) {
                  console.error('Error checking existing manual token:', error);
                  return null;
              }
          }

          // Enhanced setBearerToken function to save token
          function setBearerTokenEnhanced(token) {
              try {
                  if (window.ui && window.ui.authActions && window.ui.authSelectors) {
                      // Check if there's already a token set
                      const authSelectors = window.ui.authSelectors;
                      const auths = authSelectors.authorized();
                      let existingToken = null;
                      
                      if (auths && auths.get && auths.get('authorization')) {
                          const authData = auths.get('authorization');
                          if (authData && authData.get && authData.get('value')) {
                              existingToken = authData.get('value');
                          }
                      }
                      
                      // If there's an existing token and it's different from login token
                      if (existingToken && existingToken !== token) {
                          console.log('🔒 Existing token detected, asking user for confirmation...');
                          
                          // Show confirmation dialog
                          const shouldOverride = confirm(
                              'You already have a token set. Do you want to replace it with the new login token?\\n\\n' +
                              'Current token: ' + existingToken.substring(0, 20) + '...\\n' +
                              'New login token: ' + token.substring(0, 20) + '...\\n\\n' +
                              'Click OK to use new login token\\n' +
                              'Click Cancel to keep current token'
                          );
                          
                          if (!shouldOverride) {
                              console.log('👤 User chose to keep existing token');
                              showNotification('🔒 Keeping your current token', 'info');
                              return;
                          }
                      }
                      
                      // Set the authorization header
                      window.ui.authActions.authorize({
                          authorization: {
                              name: 'authorization',
                              schema: {
                                  type: 'http',
                                  scheme: 'bearer'
                              },
                              value: token
                          }
                      });
                      
                      // Save token to localStorage for persistence
                      localStorage.setItem('swagger_auth_token', token);
                      localStorage.setItem('swagger_auth_source', 'login'); // Mark as login token
                      
                      console.log('✅ Bearer token automatically set in Swagger UI');
                      
                      // Fetch user info after setting token
                      fetchUserInfo(token);
                      
                      // Show success notification
                      showNotification('🔐 Authentication successful! Token automatically applied to all requests.', 'success');
                  }
              } catch (error) {
                  console.error('Failed to set bearer token:', error);
                  showNotification('❌ Failed to automatically set token. Please set it manually.', 'error');
              }
          }

          // Monitor manual token setting
          function monitorManualTokenSetting() {
              if (window.ui && window.ui.authActions) {
                  const originalAuthorize = window.ui.authActions.authorize;
                  
                  window.ui.authActions.authorize = function(authData) {
                      const result = originalAuthorize.call(this, authData);

                      // The custom auto-auth calls the BASE authorize, which (unlike
                      // the Authorize dialog) does NOT persist. Write Swagger's own
                      // "authorized" key in the exact shape its loader restores on
                      // refresh, so persistAuthorization survives a page reload.
                      try {
                          if (window.ui.authSelectors) {
                              const authorized = window.ui.authSelectors.authorized();
                              const plain = authorized && authorized.toJS ? authorized.toJS() : authorized;
                              localStorage.setItem('authorized', JSON.stringify(plain));
                          }
                      } catch (e) {
                          console.warn('Could not persist Swagger authorization:', e);
                      }

                      // Save any manually set token to localStorage
                      if (authData && authData.authorization && authData.authorization.value) {
                          const token = authData.authorization.value;
                          console.log('💾 Saving token to localStorage for persistence...');
                          localStorage.setItem('swagger_auth_token', token);
                          localStorage.setItem('swagger_auth_source', 'manual');
                      }
                      
                      return result;
                  };
              }
          }

          // Initialize when Swagger UI is ready
          waitForSwaggerUI(() => {
              console.log('🚀 Swagger UI Auto-Auth initialized');
              
              // Set up manual token monitoring to save tokens
              monitorManualTokenSetting();
              
              // Check for existing authentication immediately
              const hasExistingAuth = checkExistingAuth();
              if (!hasExistingAuth) {
                  showNotification('🔧 Auto-authentication enabled! Login to automatically set bearer token.', 'info');
              }
              
              interceptFetch();
          });

      })();
    `;
