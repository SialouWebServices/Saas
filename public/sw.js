// Service Worker pour la synchronisation offline
// Gestion du cache, sync en arrière-plan et PWA

const CACHE_NAME = 'saas-rh-ci-v1'
const OFFLINE_URL = '/offline'

// Ressources critiques à mettre en cache
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/employees',
  '/payroll',
  '/auth',
  '/offline',
  '/manifest.json',
  // Styles et scripts critiques
  '/_next/static/css/app.css',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/framework.js'
]

// API endpoints pour la sync offline
const API_CACHE_URLS = [
  '/api/employees',
  '/api/payroll',
  '/api/auth/me'
]

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache ouvert, ajout des ressources statiques')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('[SW] Installation terminée')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Erreur lors de l\'installation:', error)
      })
  )
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Supprimer les anciens caches
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Suppression du cache obsolète:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('[SW] Activation terminée')
        return self.clients.claim()
      })
  )
})

// Gestion des requêtes (stratégies de cache)
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
    return
  }

  // Stratégies selon le type de ressource
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API: Network First avec fallback cache
      event.respondWith(networkFirstStrategy(request))
    } else if (STATIC_CACHE_URLS.includes(url.pathname)) {
      // Ressources statiques: Cache First
      event.respondWith(cacheFirstStrategy(request))
    } else if (url.pathname.match(/\\.(css|js|png|jpg|jpeg|svg|ico)$/)) {
      // Assets: Cache First avec Network Fallback
      event.respondWith(cacheFirstStrategy(request))
    } else {
      // Pages: Network First avec fallback offline
      event.respondWith(networkFirstWithOfflineFallback(request))
    }
  }

  // Requêtes POST/PUT/DELETE: toujours réseau, queue si offline
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    event.respondWith(networkOnlyWithQueue(request))
  }
})

// Stratégie Cache First
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('[SW] Cache First Error:', error)
    return new Response('Contenu indisponible', { status: 503 })
  }
}

// Stratégie Network First
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Mettre à jour le cache
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Réseau indisponible, tentative cache pour:', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Retourner une réponse d'erreur structurée pour les APIs
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          erreur: 'Mode hors ligne',
          offline: true,
          timestamp: Date.now()
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response('Service indisponible', { status: 503 })
  }
}

// Network First avec fallback page offline
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Retourner la page offline
    return caches.match(OFFLINE_URL)
  }
}

// Network Only avec mise en queue si offline
async function networkOnlyWithQueue(request) {
  try {
    return await fetch(request)
  } catch (error) {
    console.log('[SW] Requête en échec, ajout à la queue:', request.url)
    
    // Stocker la requête pour synchronisation ultérieure
    await queueRequest(request)
    
    return new Response(
      JSON.stringify({
        erreur: 'Requête mise en queue pour synchronisation',
        queued: true,
        timestamp: Date.now()
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Mise en queue des requêtes pour sync ultérieure
async function queueRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    }

    // Stocker dans IndexedDB
    const db = await openSyncDB()
    const transaction = db.transaction(['requests'], 'readwrite')
    const store = transaction.objectStore('requests')
    await store.add(requestData)
    
    console.log('[SW] Requête ajoutée à la queue de sync')
  } catch (error) {
    console.error('[SW] Erreur ajout queue:', error)
  }
}

// Ouverture de la base IndexedDB pour la sync
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SaasRHSyncDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('requests')) {
        const store = db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('url', 'url', { unique: false })
      }
      
      if (!db.objectStoreNames.contains('data')) {
        const dataStore = db.createObjectStore('data', { keyPath: 'key' })
        dataStore.createIndex('type', 'type', { unique: false })
        dataStore.createIndex('lastSync', 'lastSync', { unique: false })
      }
    }
  })
}

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[SW] Événement de synchronisation:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processQueuedRequests())
  }
  
  if (event.tag === 'data-sync') {
    event.waitUntil(syncApplicationData())
  }
})

// Traitement des requêtes en queue
async function processQueuedRequests() {
  try {
    console.log('[SW] Traitement des requêtes en queue...')
    
    const db = await openSyncDB()
    const transaction = db.transaction(['requests'], 'readonly')
    const store = transaction.objectStore('requests')
    const requests = await store.getAll()
    
    for (const requestData of requests) {
      try {
        // Reconstituer la requête
        const request = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        })
        
        // Tenter l'envoi
        const response = await fetch(request)
        
        if (response.ok) {
          // Supprimer de la queue si succès
          const deleteTransaction = db.transaction(['requests'], 'readwrite')
          const deleteStore = deleteTransaction.objectStore('requests')
          await deleteStore.delete(requestData.id)
          
          console.log('[SW] Requête synchronisée avec succès:', requestData.url)
          
          // Notifier l'application
          notifyApp('sync-success', {
            url: requestData.url,
            timestamp: requestData.timestamp
          })
        }
      } catch (error) {
        console.error('[SW] Erreur sync requête:', requestData.url, error)
      }
    }
  } catch (error) {
    console.error('[SW] Erreur traitement queue:', error)
  }
}

// Synchronisation des données applicatives
async function syncApplicationData() {
  try {
    console.log('[SW] Synchronisation des données...')
    
    // Sync des employés
    await syncEmployees()
    
    // Sync des bulletins de paie
    await syncPayroll()
    
    // Notifier l'application
    notifyApp('data-sync-complete', { timestamp: Date.now() })
    
  } catch (error) {
    console.error('[SW] Erreur sync données:', error)
    notifyApp('data-sync-error', { error: error.message })
  }
}

// Synchronisation spécifique des employés
async function syncEmployees() {
  try {
    const response = await fetch('/api/employees?sync=true')
    if (response.ok) {
      const data = await response.json()
      
      // Stocker en local
      await storeLocalData('employees', data.employes, Date.now())
      console.log('[SW] Employés synchronisés')
    }
  } catch (error) {
    console.error('[SW] Erreur sync employés:', error)
  }
}

// Synchronisation spécifique des bulletins
async function syncPayroll() {
  try {
    const response = await fetch('/api/payroll?sync=true')
    if (response.ok) {
      const data = await response.json()
      
      // Stocker en local
      await storeLocalData('payroll', data.bulletins, Date.now())
      console.log('[SW] Bulletins synchronisés')
    }
  } catch (error) {
    console.error('[SW] Erreur sync bulletins:', error)
  }
}

// Stockage local des données
async function storeLocalData(type, data, lastSync) {
  try {
    const db = await openSyncDB()
    const transaction = db.transaction(['data'], 'readwrite')
    const store = transaction.objectStore('data')
    
    await store.put({
      key: type,
      type: type,
      data: data,
      lastSync: lastSync,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('[SW] Erreur stockage local:', error)
  }
}

// Notification à l'application
function notifyApp(type, data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: type,
        data: data
      })
    })
  })
}

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Notification push reçue')
  
  if (!event.data) {
    return
  }

  const data = event.data.json()
  
  const options = {
    body: data.body || 'Nouvelle notification SaaS RH CI',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/icons/open.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icons/close.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'SaaS RH CI', options)
  )
})

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic sur notification')
  
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const url = event.notification.data.url || '/dashboard'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Si une fenêtre est déjà ouverte, la focuser
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Message du client principal
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data)
  
  if (event.data.type === 'FORCE_SYNC') {
    // Forcer la synchronisation
    self.registration.sync.register('background-sync')
    self.registration.sync.register('data-sync')
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    // Vider le cache
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true })
    })
  }
})