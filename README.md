# Discord Clone

A client-side rendered React SPA, utilising a Firebase backend, bundled with Vite.

<!-- ![](discord_clone_showcase.gif)   -->

**Hosted on Firebase**  
https://definitely-not-discord-8bf44.web.app/

**Sign in options**  
Signing in with a Google account is the only supported sign in method.

## Summary

This project is a feature-light clone of the popular communication platform, Discord. The main aim of the project was to gain experince with real-time updates between users, as well as investigate WebRTC. As such, the focus of the feature set surrounds instant messaging and voice chat.

There are four preset 'servers', and each 'server' has two text chat channels, and a voice channel. Messages are sync'd between users through a Firestore database, and are scoped to their respective channel and 'server'. In this instance, the 'servers' are represented by Firestore documents. Voice chat is possible through the use of WebRTC, where the Firestore acts as a listening server. The connections use a full-mesh topology, and due the the unscalably nature of this design, voice chat channels are restricted to a maximum of six users.

## What I learned

This project allowed me to gain more experience with the real-time update functionality of Firebase Firestore, and the ways in which this NoSQL database layout differs from a relational model. In this instance, the main draw of Firestore was the built-in snapshot listeners, allowing for a 'websockets-like' solution to real-time text chat between users. With Firestore, this proved trivial to implement, along with the authentication API which Firebase makes available.

The more challenging part of this application was the multi-peer voice channels using WebRTC. Prior to this, I had not used this technology, and spent some time understanding how the connections are made between peers. At which point, I set up a peer to peer channel to confirm my understanding. This was successful, so I drafted a plan to implement a full-mesh topology, where each peer has a connection to every other peer in the channel. Full mesh is the simplest method to connect small numbers of clients, and as I had no intention of scaling this project, the connection formula of n(n-1)/2 was not an issue. The voice channels are limited to six users for this reason.

In implementing the full mesh I also encountered some issues with storing and mutating data on the client side. Typically, the connection data would be stored in React state, however the connections frequently need to be mutated with asynchronous functions, and state is seen as immutable. This made the connection objects a better target for a ref based solution, however, the UI still needed to update when connections were added and removed, both visually, and with the presence of audio elements to host the media streams. Combining state storing connected user information with refs storing the connections and audio elements proved successful, without the need for arbitrary setState calls to force rerenders.

## Features

- Online user list
- Server list
- Channel list
- Sign in/out functionality
- Instant messaging
- Voice chat (connect/disconnect)

## Technologies Used

- HTML
- CSS
- TypeScript
- React
- Vite
- Firebase
- WebRTC
