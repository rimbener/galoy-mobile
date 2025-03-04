import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { Text, View } from "react-native"
import { Button } from "react-native-elements"
import EStyleSheet from "react-native-extended-stylesheet"
import { gql, useApolloClient, useMutation } from "@apollo/client"
import { RouteProp } from "@react-navigation/native"
import ReactNativeHapticFeedback from "react-native-haptic-feedback"

import { Screen } from "../../components/screen"
import { translate } from "../../i18n"
import type { MoveMoneyStackParamList } from "../../navigation/stack-param-lists"
import { queryMain } from "../../graphql/query"
import { useWalletBalance, usePriceConversions } from "../../hooks"
import { PaymentStatusIndicator } from "./payment-status-indicator"
import { color } from "../../theme"
import { StackNavigationProp } from "@react-navigation/stack"
import { PaymentConfirmationInformation } from "./payment-confirmation-information"
import useFee from "./use-fee"

export const LN_PAY = gql`
  mutation lnInvoicePaymentSend($input: LnInvoicePaymentInput!) {
    lnInvoicePaymentSend(input: $input) {
      errors {
        message
      }
      status
    }
  }
`

const LN_NO_AMOUNT_PAY = gql`
  mutation lnNoAmountInvoicePaymentSend($input: LnNoAmountInvoicePaymentInput!) {
    lnNoAmountInvoicePaymentSend(input: $input) {
      errors {
        message
      }
      status
    }
  }
`

export const INTRA_LEDGER_PAY = gql`
  mutation intraLedgerPaymentSend($input: IntraLedgerPaymentSendInput!) {
    intraLedgerPaymentSend(input: $input) {
      errors {
        message
      }
      status
    }
  }
`

const ONCHAIN_PAY = gql`
  mutation onChainPaymentSend($input: OnChainPaymentSendInput!) {
    onChainPaymentSend(input: $input) {
      errors {
        message
      }
      status
    }
  }
`

type SendBitcoinConfirmationScreenProps = {
  navigation: StackNavigationProp<MoveMoneyStackParamList, "sendBitcoinConfirmation">
  route: RouteProp<MoveMoneyStackParamList, "sendBitcoinConfirmation">
}

const Status = {
  IDLE: "idle",
  LOADING: "loading",
  PENDING: "pending",
  SUCCESS: "success",
  ERROR: "error",
} as const

type StatusType = typeof Status[keyof typeof Status]

export const SendBitcoinConfirmationScreen = ({
  navigation,
  route,
}: SendBitcoinConfirmationScreenProps): JSX.Element => {
  const client = useApolloClient()
  const { convertCurrencyAmount, formatCurrencyAmount } = usePriceConversions()
  const { satBalance } = useWalletBalance(client)

  const {
    address,
    amountless,
    invoice,
    memo,
    paymentType,
    primaryCurrency,
    referenceAmount,
    sameNode,
    username,
    userDefaultWalletId,
  } = route.params

  const [errs, setErrs] = useState<{ message: string }[]>([])
  const [status, setStatus] = useState<StatusType>(Status.IDLE)

  const paymentSatAmount = convertCurrencyAmount({
    amount: referenceAmount.value,
    from: referenceAmount.currency,
    to: "BTC",
  })

  const fee = useFee({
    address,
    amountless,
    invoice,
    paymentType,
    sameNode,
    paymentSatAmount,
    primaryCurrency,
  })

  const [lnPay] = useMutation(LN_PAY, { refetchQueries: ["mainQuery"] })

  const [lnNoAmountPay] = useMutation(LN_NO_AMOUNT_PAY, { refetchQueries: ["mainQuery"] })

  const [intraLedgerPay] = useMutation(INTRA_LEDGER_PAY, {
    refetchQueries: ["mainQuery"],
  })

  // TODO: add user automatically to cache

  const [onchainPay] = useMutation(ONCHAIN_PAY, { refetchQueries: ["mainQuery"] })

  const handlePaymentReturn = (status, errors) => {
    if (status === "SUCCESS") {
      queryMain(client, { hasToken: true })
      setStatus(Status.SUCCESS)
    } else if (status === "PENDING") {
      setStatus(Status.PENDING)
    } else {
      setStatus(Status.ERROR)
      setErrs(
        errors.map((error) => {
          // Todo: provide specific translated error messages in known cases
          return { message: translate("errors.generic") + error.message }
        }),
      )
    }
  }

  const handlePaymentError = (error) => {
    setStatus(Status.ERROR)
    // Todo: provide specific translated error messages in known cases
    setErrs([{ message: translate("errors.generic") + error }])
  }

  const payWallet = async () => {
    setErrs([])
    setStatus(Status.LOADING)
    try {
      const { data, errors } = await intraLedgerPay({
        variables: {
          input: {
            recipientWalletId: userDefaultWalletId,
            amount: paymentSatAmount,
            memo,
          },
        },
      })

      const status = data.intraLedgerPaymentSend.status
      const errs = errors
        ? errors.map((error) => {
            return { message: error.message }
          })
        : data.intraLedgerPaymentSend.errors
      handlePaymentReturn(status, errs)
    } catch (err) {
      handlePaymentError(err)
    }
  }

  const payLightning = async () => {
    setErrs([])
    setStatus(Status.LOADING)
    try {
      const { data, errors } = await lnPay({
        variables: {
          input: {
            paymentRequest: invoice,
            memo,
          },
        },
      })

      const status = data.lnInvoicePaymentSend.status
      const errs = errors
        ? errors.map((error) => {
            return { message: error.message }
          })
        : data.lnInvoicePaymentSend.errors
      handlePaymentReturn(status, errs)
    } catch (err) {
      handlePaymentError(err)
    }
  }

  const payAmountlessLightning = async () => {
    if (paymentSatAmount === 0) {
      setStatus(Status.ERROR)
      setErrs([{ message: translate("SendBitcoinScreen.noAmount") }])
      return
    }

    setErrs([])
    setStatus(Status.LOADING)
    try {
      const { data, errors } = await lnNoAmountPay({
        variables: {
          input: {
            paymentRequest: invoice,
            amount: paymentSatAmount,
            memo,
          },
        },
      })

      const status = data.lnNoAmountInvoicePaymentSend.status
      const errs = errors
        ? errors.map((error) => {
            return { message: error.message }
          })
        : data.lnNoAmountInvoicePaymentSend.errors
      handlePaymentReturn(status, errs)
    } catch (err) {
      handlePaymentError(err)
    }
  }

  const payOnchain = async () => {
    if (paymentSatAmount === 0) {
      setStatus(Status.ERROR)
      setErrs([{ message: translate("SendBitcoinScreen.noAmount") }])
      return
    }

    setErrs([])
    setStatus(Status.LOADING)

    try {
      const { data, errors } = await onchainPay({
        variables: {
          input: {
            address,
            amount: paymentSatAmount,
            memo,
          },
        },
      })
      const status = data.onChainPaymentSend.status
      const errs = errors
        ? errors.map((error) => {
            return { message: error.message }
          })
        : data.onChainPaymentSend.errors
      handlePaymentReturn(status, errs)
    } catch (err) {
      handlePaymentError(err)
    }
  }

  const pay = async () => {
    if (paymentType === "username") {
      payWallet()
      return
    }

    if (paymentType === "lightning") {
      if (amountless) {
        payAmountlessLightning()
      } else {
        payLightning()
      }
      return
    }

    if (paymentType === "onchain") {
      payOnchain()
      return
    }
  }

  useEffect(() => {
    if (status === "loading" || status === "idle") {
      return
    }

    let notificationType

    if (status === Status.PENDING || status === Status.ERROR) {
      notificationType = "notificationError"
    }

    if (status === Status.SUCCESS) {
      notificationType = "notificationSuccess"
    }

    const optionsHaptic = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    }

    ReactNativeHapticFeedback.trigger(notificationType, optionsHaptic)
  }, [status])

  const totalAmount = useMemo(() => {
    return fee.value === null ? paymentSatAmount : paymentSatAmount + fee.value
  }, [fee.value, paymentSatAmount])

  const balance = satBalance

  const errorMessage = useMemo(() => {
    if (totalAmount > balance) {
      return translate("SendBitcoinConfirmationScreen.totalExceed", {
        balance: formatCurrencyAmount({ sats: balance, currency: primaryCurrency }),
      })
    }

    return ""
  }, [balance, formatCurrencyAmount, primaryCurrency, totalAmount])

  let destination = ""
  if (paymentType === "username") {
    destination = username
  } else if (paymentType === "lightning") {
    destination = `${invoice.substr(0, 18)}...${invoice.substr(-18)}`
  } else if (paymentType === "onchain") {
    destination = address
  }

  const primaryAmount: MoneyAmount = {
    value: convertCurrencyAmount({
      amount: referenceAmount.value,
      from: referenceAmount.currency,
      to: primaryCurrency,
    }),
    currency: primaryCurrency,
  }

  const primaryTotalAmount: MoneyAmount = {
    value: convertCurrencyAmount({
      amount: totalAmount,
      from: "BTC",
      to: primaryCurrency,
    }),
    currency: primaryCurrency,
  }

  const secondaryCurrency: CurrencyType = primaryCurrency === "BTC" ? "USD" : "BTC"

  const secondaryAmount: MoneyAmount = {
    value: convertCurrencyAmount({
      amount: referenceAmount.value,
      from: referenceAmount.currency,
      to: secondaryCurrency,
    }),
    currency: secondaryCurrency,
  }

  const secondaryTotalAmount: MoneyAmount = {
    value: convertCurrencyAmount({
      amount: totalAmount,
      from: "BTC",
      to: secondaryCurrency,
    }),
    currency: secondaryCurrency,
  }

  const hasCompletedPayment =
    status === Status.SUCCESS || status === Status.PENDING || status === Status.ERROR

  return (
    <Screen preset="scroll">
      <View style={styles.mainView}>
        <View style={styles.paymentInformationContainer}>
          <PaymentConfirmationInformation
            fee={fee}
            destination={destination}
            memo={memo}
            primaryAmount={primaryAmount}
            secondaryAmount={secondaryAmount}
            primaryTotalAmount={primaryTotalAmount}
            secondaryTotalAmount={secondaryTotalAmount}
          />
        </View>
        {hasCompletedPayment && (
          <View style={styles.paymentLottieContainer}>
            <PaymentStatusIndicator errs={errs} status={status} />
          </View>
        )}
        {!hasCompletedPayment && errorMessage.length > 0 && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        <View style={styles.bottomContainer}>
          {status === "idle" && errorMessage.length === 0 && (
            <View style={styles.confirmationTextContainer}>
              <Text style={styles.confirmationText}>
                {translate("SendBitcoinConfirmationScreen.confirmPayment?")}
              </Text>
              <Text style={styles.confirmationText}>
                {translate("SendBitcoinConfirmationScreen.paymentFinal")}
              </Text>
            </View>
          )}
          <Button
            buttonStyle={styles.buttonStyle}
            loading={status === "loading"}
            onPress={() => {
              if (hasCompletedPayment) {
                navigation.pop(2)
              } else if (errorMessage.length > 0) {
                navigation.pop(1)
              } else {
                pay()
              }
            }}
            title={
              hasCompletedPayment
                ? translate("common.close")
                : errorMessage.length > 0
                ? translate("common.cancel")
                : translate("SendBitcoinConfirmationScreen.confirmPayment")
            }
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = EStyleSheet.create({
  bottomContainer: {
    flex: 2,
    justifyContent: "flex-end",
  },

  buttonStyle: {
    backgroundColor: color.primary,
    marginBottom: "32rem",
    marginHorizontal: "12rem",
    marginTop: "32rem",
  },

  confirmationText: {
    fontSize: "18rem",
    textAlign: "center",
  },

  confirmationTextContainer: {
    alignItems: "center",
  },

  errorContainer: {
    alignItems: "center",
    flex: 1,
  },

  errorText: {
    color: color.error,
    textAlign: "center",
  },

  mainView: {
    flex: 1,
    paddingHorizontal: "24rem",
  },

  paymentInformationContainer: {
    flex: 4,
  },

  paymentLottieContainer: {
    alignItems: "center",
    flex: 2,
  },
})
