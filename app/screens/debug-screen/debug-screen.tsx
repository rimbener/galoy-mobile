import * as React from "react"
import { useCallback } from "react"
import { Alert, DevSettings, Text, View } from "react-native"
import { Button, ButtonGroup } from "react-native-elements"
import EStyleSheet from "react-native-extended-stylesheet"
import { useApolloClient } from "@apollo/client"

import { Screen } from "../../components/screen"
import { color } from "../../theme"
import { resetDataStore } from "../../utils/logout"
import { getGraphQLUri, loadNetwork, saveNetwork } from "../../utils/network"
import { requestPermission } from "../../utils/notifications"
import useToken from "../../utils/use-token"
import type { ScreenType } from "../../types/jsx"
import type { INetwork } from "../../types/network"
import { networkVar } from "../../graphql/client-only-query"
import { usePriceConversions } from "../../hooks"

const styles = EStyleSheet.create({
  button: {
    marginHorizontal: "24rem",
    marginVertical: "6rem",
  },

  container: { marginLeft: 36, marginRight: 36, marginTop: 24 },
})

const usingHermes = typeof HermesInternal === "object" && HermesInternal !== null

export const DebugScreen: ScreenType = () => {
  const client = useApolloClient()
  const { usdPerSat } = usePriceConversions()
  const { hasToken, tokenUid, tokenNetwork, removeToken } = useToken()

  const networks: INetwork[] = ["regtest", "testnet", "mainnet"]
  const [networkState, setNetworkState] = React.useState("")
  const [graphQLURIs, setGraphQLURIs] = React.useState({
    GRAPHQL_URI: "",
    GRAPHQL_WS_URI: "",
  })

  const updateNetwork = useCallback(
    async (network?) => {
      let newNetwork = tokenNetwork || network
      if (!newNetwork) {
        if (networkVar()) {
          newNetwork = networkVar()
        } else {
          newNetwork = await loadNetwork()
        }
      }
      setGraphQLURIs(getGraphQLUri(newNetwork))
      setNetworkState(newNetwork)
    },
    [tokenNetwork],
  )

  React.useEffect(() => {
    updateNetwork()
  }, [updateNetwork])

  return (
    <Screen preset="scroll" backgroundColor={color.transparent}>
      {/* <Button
        title="Delete account and log out (TODO)"
        onPress={async () => {
          resetDataStore()
          if (token.has()) {
            try { // FIXME
              const query = `mutation deleteCurrentUser {
                deleteCurrentUser
              }`
              // const result = await request(getGraphQLUri(), query, {uid: "1234"})
              // FIXME
            } catch (err) {
              console.log(`${err}`)
            }
          }
          await token.delete()
          Alert.alert("user succesfully deleted. Restart your app")
        }}
        /> */}
      <Button
        title="Log out"
        style={styles.button}
        onPress={async () => {
          await resetDataStore({ client, removeToken })
          Alert.alert("state succesfully deleted. Restart your app")
        }}
      />
      <Button
        title="Send notifications"
        style={styles.button}
        onPress={async () => {
          // TODO
          // mutateTestMessage()
        }}
      />
      <Button
        title="Copy store"
        style={styles.button}
        onPress={() => {
          // Clipboard.setString(JSON.stringify(store))
          // Alert.alert("Store copied in clipboard. send it over whatsapp or email")
        }}
      />
      <Button
        title="Request permission + send device token"
        style={styles.button}
        onPress={async () => {
          hasToken && requestPermission(client)
        }}
      />
      {__DEV__ && (
        <Button
          title="Reload"
          style={styles.button}
          onPress={() => DevSettings.reload()}
        />
      )}
      {/* <Button
          title="Crash test"
          style={styles.button}
          onPress={() => {
            crashlytics().log("Testing crash")
            crashlytics().crash()
          }}
        /> */}
      <View>
        <Text>
          UID:
          {tokenUid}
        </Text>
        <Text>
          Token network:
          {tokenNetwork}
        </Text>
        <Text>
          GRAPHQL_URL:
          {graphQLURIs.GRAPHQL_URI}
        </Text>
        <Text>
          GRAPHQL_WS_URL:
          {graphQLURIs.GRAPHQL_WS_URI}
        </Text>
        <Text>USD per 1 sat: ${usdPerSat}</Text>
        <Text>
          Hermes:
          {String(!!usingHermes)}
        </Text>

        <ButtonGroup
          onPress={(index) => {
            saveNetwork(networks[index])
            networkVar(networks[index])
            updateNetwork(networks[index])
          }}
          selectedIndex={networks.findIndex((value) => value === networkState)}
          buttons={networks}
          buttonStyle={styles.button} // FIXME
          containerStyle={styles.container}
        />
      </View>
    </Screen>
  )
}
