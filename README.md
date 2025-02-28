# GaloyMobile

<img src=".readme/galoy-logo.png" alt="Galoy Logo" width="300">

## Goal

This repository is the Bitcoin Beach Wallet mobile application. The goal is to make a mobile application compatible with Galoy's backend that can be customized and used by any community or organization. It is built with [React Native](https://reactnative.dev/), and runs on both iOS and Android.

## Screenshots

<img src=".readme/screenshot-1.png" alt="Screenshot 1" width="150"> <img src=".readme/screenshot-2.png" alt="Screenshot 2" width="150"> <img src=".readme/screenshot-3.png" alt="Screenshot 3" width="150"> <img src=".readme/screenshot-4.png" alt="Screenshot 4" width="150">

## Contributing

If you wish to contribute see [CONTRIBUTING.MD](./CONTRIBUTING.MD)

## Start

Prerequisite -- [Set up React Native](https://reactnative.dev/docs/environment-setup) by following the instructions in the **React Native CLI Quickstart** tab

Clone into the project

cd into the directory

type `yarn install`

type `yarn start`

In another window
type `yarn ios` or `yarn android` to run locally.

The app is built and pushed to the App Store and Play Store on demand with CircleCI.

To run the app fully locally the backend must also be set up by following the instructions at https://github.com/GaloyMoney/galoy.

## Running Storybook

From the command line in your generated app's root directory, enter `yarn storybook`
This starts up the storybook server.

In `app/app.tsx`, change `SHOW_STORYBOOK` to `true` and reload the app.

For Visual Studio Code users, there is a handy extension that makes it easy to load Storybook use cases into a running emulator via tapping on items in the editor sidebar. Install the `React Native Storybook` extension by `Orta`, hit `cmd + shift + P` and select "Reconnect Storybook to VSCode". Expand the STORYBOOK section in the sidebar to see all use cases for components that have `.story.tsx` files in their directories.
