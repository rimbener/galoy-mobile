import { contacts_me_contacts } from "../screens/contacts-screen/__generated__/contacts"
import { AccountType, AuthenticationScreenPurpose, PinScreenPurpose } from "../utils/enum"
import { IPaymentType } from "../utils/parsing"

type TransactionDetail = WalletTransaction & {
  usdAmount: number
  description: string
  isReceive: boolean
  isPending: boolean
}

export type RootStackParamList = {
  getStarted: undefined
  debug: undefined
  welcomeFirst: undefined
  authenticationCheck: undefined
  authentication: {
    screenPurpose: AuthenticationScreenPurpose
    isPinEnabled: boolean
  }
  pin: { screenPurpose: PinScreenPurpose }
  Primary: undefined
  earnsSection: { section: number }
  earnsQuiz: {
    title: string
    text: string
    amount: number
    question: string
    answers: string[]
    feedback: string[]
    onComplete: () => Promise<void>
    id: string
    completed: boolean
  }
  settings: undefined
  setUsername: undefined
  language: undefined
  security: {
    mIsBiometricsEnabled: boolean
    mIsPinEnabled: boolean
  }
  sectionCompleted: { amount: number; sectionTitle: string }
  priceDetail: {
    account: AccountType
  }
  Profile: undefined
  phoneValidation: undefined
  transactionDetail: TransactionDetail
  transactionHistory: undefined
  Earn: undefined
}

export type ContactStackParamList = {
  Contacts: undefined
  contactDetail: { contact: contacts_me_contacts }
  phoneValidation: undefined
  sendBitcoin: { username: string }
  transactionDetail: TransactionDetail
}

export type MoveMoneyStackParamList = {
  moveMoney: undefined
  phoneValidation: undefined
  priceDetail: { account: AccountType }
  Profile: undefined
  receiveBitcoin: undefined
  scanningQRCode: undefined
  sendBitcoin: {
    payment: string | null
    username?: string | null
  }
  sendBitcoinConfirmation: {
    address: string | null
    amountless: boolean
    invoice: string | null
    memo: string | null
    paymentType: IPaymentType
    primaryCurrency: CurrencyType
    referenceAmount: MoneyAmount
    sameNode: boolean | null
    username: string | null
    userDefaultWalletId: string | null
  }
  settings: undefined
  transactionDetail: TransactionDetail
}

export type PhoneValidationStackParamList = {
  welcomePhoneInput: undefined
  welcomePhoneValidation: {
    phone: string
    setPhone: (string) => void
  }
  authentication: {
    screenPurpose: AuthenticationScreenPurpose
  }
  moveMoney: undefined
}

export type PrimaryStackParamList = {
  MoveMoney: undefined
  Contacts: undefined
  Map: undefined
  Earn: undefined
  sendBitcoin: { username: string }
  phoneValidation: undefined
  earnsSection: { section: string }
}
