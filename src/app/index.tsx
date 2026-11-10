import React, {useState, useEffect, createContext, useContext} from 'react'
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView,
  StatusBar, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native'
import {NavigationContainer} from '@react-navigation/native'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {Ionicons} from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'

// --- УВЕДОМЛЕНИЯ ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
})

// --- КОНТЕКСТ ---
const AppContext = createContext<any>(null)

const COLORS = {
  bg: '#F2F7FA',
  primary: '#0077B6',
  card: '#FFFFFF',
  text: '#1E3A5F',
  textLight: '#8DA8C0',
  error: '#ef5350',
  success: '#66BB6A',
}

// --- ФУНКЦИЯ ДЛЯ ЦИТАТЫ (API) ---
async function fetchQuote() {
  try {
    const response = await fetch('https://api.quotable.io/random')
    const data = await response.json()
    return {text: data.content, author: data.author}
  } catch (error) {
    return {text: 'Вода — это жизнь.', author: 'Народная мудрость'}
  }
}

// ==========================================
// ЭКРАН РЕГИСТРАЦИИ (РАБОТАЕТ С API)
// ==========================================
function RegisterScreen({navigation}: any) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)

  const checkName = (text: string) => {
    setName(text)
    if (text.length > 0 && !/^[а-яА-Яa-zA-Z\s]+$/.test(text)) setNameError('Только буквы и пробелы')
    else if (text.length > 0 && text.length < 2) setNameError('Слишком короткое имя')
    else setNameError('')
  }

  const checkEmail = (text: string) => {
    setEmail(text)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (text.length > 0 && !emailRegex.test(text)) setEmailError('Неверный формат')
    else setEmailError('')
  }

  const checkPassword = (text: string) => {
    setPassword(text)
    let strength = 0
    if (text.length > 0) {
      if (text.length >= 8) strength++
      if (/[A-Z]/.test(text)) strength++
      if (/[0-9]/.test(text) || /[^a-zA-Z0-9]/.test(text)) strength++
    }
    setPasswordStrength(strength)
  }

  const getPasswordStrengthData = () => {
    if (passwordStrength === 0) return {color: '#E0EAF2', text: '', width: '0%'}
    if (passwordStrength === 1) return {color: COLORS.error, text: 'Слабый', width: '33%'}
    if (passwordStrength === 2) return {color: '#FFA726', text: 'Средний', width: '66%'}
    return {color: COLORS.success, text: 'Надежный', width: '100%'}
  }

  const strengthData = getPasswordStrengthData()
  const emailRegexTest = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)

  const isFormValid = () => {
    return name.length >= 2 && !nameError && !emailError && emailRegexTest(email) && passwordStrength === 3
  }

  const handleRegister = async () => {
    if (!isFormValid()) {
      Alert.alert('Ошибка', 'Проверьте поля')
      return
    }
    try {
      const response = await fetch('http://10.0.2.2:3000/api/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email: email.toLowerCase(), password}),
      })

      const data = await response.json()

      if (!response.ok) {
        Alert.alert('Ошибка', data.error || 'Не удалось зарегистрироваться')
        return
      }

      await AsyncStorage.setItem('@currentUser', JSON.stringify(data))
      Alert.alert('Успех', 'Аккаунт создан!')
      navigation.replace('MainApp')
    } catch (error) {
      Alert.alert('Ошибка', 'Нет связи с сервером. Проверь, запущен ли node server.js')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.registerContainer, {paddingBottom: 40}]}>
        <Text style={styles.logoText}>ВОДНЫЙ БАЛАНС</Text>
        <Text style={styles.title}>Создать аккаунт</Text>
        <Text style={styles.subtitle}>Заполни данные, чтобы начать</Text>

        <TextInput style={[styles.input, nameError ? styles.inputError : null]} placeholder="Твоё имя" value={name} onChangeText={checkName} />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        <TextInput style={[styles.input, emailError ? styles.inputError : null]} placeholder="Электронная почта" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={checkEmail} />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        <TextInput style={[styles.input, password.length > 0 && passwordStrength < 3 ? styles.inputError : null]} placeholder="Придумай пароль" secureTextEntry value={password} onChangeText={checkPassword} />
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarBg}>
              <View style={[styles.strengthBarFill, {width: strengthData.width, backgroundColor: strengthData.color}]} />
            </View>
            <Text style={[styles.strengthText, {color: strengthData.color}]}>{strengthData.text}</Text>
          </View>
        )}
        <Text style={styles.hintText}>Мин. 8 символов, 1 заглавная буква и 1 цифра</Text>

        <TouchableOpacity style={[styles.mainButton, !isFormValid() && {opacity: 0.5}]} onPress={handleRegister} disabled={!isFormValid()}>
          <Text style={styles.mainButtonText}>Зарегистрироваться</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.hintText}>Уже есть аккаунт? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// ЭКРАН ВХОДА (РАБОТАЕТ С API)
// ==========================================
function LoginScreen({navigation}: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Введите почту и пароль')
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('http://10.0.2.2:3000/api/users')
      const users = await response.json()

      const user = users.find((u: any) => u.email === email.toLowerCase() && u.password === password)

      if (user) {
        await AsyncStorage.setItem('@currentUser', JSON.stringify(user))
        navigation.replace('MainApp')
      } else {
        Alert.alert('Ошибка', 'Неверная почта или пароль')
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Нет связи с сервером')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.registerContainer, {paddingTop: 100}]}>
        <Text style={styles.logoText}>ВОДНЫЙ БАЛАНС</Text>
        <Text style={styles.title}>С возвращением!</Text>
        <Text style={styles.subtitle}>Войди, чтобы продолжить</Text>
        <TextInput style={styles.input} placeholder="Электронная почта" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Пароль" secureTextEntry value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.mainButton} onPress={handleLogin} disabled={isLoading}>
          <Text style={styles.mainButtonText}>{isLoading ? 'Загрузка...' : 'Войти'}</Text>
        </TouchableOpacity>
        <View style={styles.loginRow}>
          <Text style={styles.hintText}>Нет аккаунта? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Создать</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// 1. ЭКРАН ГЛАВНАЯ
// ==========================================
function HomeScreen() {
  const {consumed, norm, addWater, resetDay} = useContext(AppContext)
  const [modalVisible, setModalVisible] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [quote, setQuote] = useState<{text: string; author: string} | null>(null)

  useEffect(() => {
    fetchQuote().then(q => setQuote(q))
  }, [])

  const progress = Math.min((consumed / norm) * 100, 100)
  const handleAdd = (amount: number) => {
    addWater(amount)
    setModalVisible(false)
    setCustomAmount('')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.greeting}>Привет!</Text>
        <Text style={styles.title}>Твой водный баланс</Text>
        {quote && (
          <View style={[styles.card, {backgroundColor: '#FFF9C4', borderLeftWidth: 4, borderLeftColor: '#FBC02D'}]}>
            <Text style={{fontSize: 15, fontStyle: 'italic', color: COLORS.text, marginBottom: 5}}>«{quote.text}»</Text>
            <Text style={{fontSize: 13, color: COLORS.textLight, textAlign: 'right'}}>— {quote.author}</Text>
          </View>
        )}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Сегодня выпито</Text>
          <Text style={styles.bigNumber}>{consumed} мл</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {width: `${progress}%`}]} />
          </View>
          <Text style={styles.cardSubtext}>Осталось: {Math.max(norm - consumed, 0)} мл</Text>
        </View>
        <TouchableOpacity style={styles.mainButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.mainButtonText}>+ Добавить воду</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Быстро добавить</Text>
        <View style={styles.row}>
          {[150, 250, 500].map(ml => (
            <TouchableOpacity key={ml} style={styles.quickBtn} onPress={() => addWater(ml)}>
              <Text style={styles.quickBtnText}>{ml} мл</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.resetButton} onPress={resetDay}>
          <Text style={styles.resetButtonText}>Сбросить день</Text>
        </TouchableOpacity>
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Добавить воду</Text>
              <View style={styles.row}>
                {[150, 250, 500].map(ml => (
                  <TouchableOpacity key={ml} style={styles.quickBtn} onPress={() => handleAdd(ml)}>
                    <Text style={styles.quickBtnText}>{ml} мл</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="Свой объем (мл)" value={customAmount} onChangeText={setCustomAmount} />
              <TouchableOpacity style={styles.mainButton} onPress={() => handleAdd(Number(customAmount) || 0)}>
                <Text style={styles.mainButtonText}>Добавить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// 2. ЭКРАН ИСТОРИЯ
// ==========================================
function HistoryScreen() {
  const {history} = useContext(AppContext)
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>История</Text>
        <Text style={styles.greeting}>Сегодня</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>Вы еще не пили воду сегодня.</Text>
        ) : (
          history.map((item: any, index: number) => (
            <View key={index} style={[styles.card, styles.historyRow]}>
              <View>
                <Text style={styles.historyTime}>{item.time}</Text>
                <Text style={styles.historyTitle}>Вода</Text>
              </View>
              <Text style={styles.historyAmount}>+{item.amount} мл</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// 3. ЭКРАН ДРУЗЬЯ
// ==========================================
function FriendsScreen() {
  const {currentUser} = useContext(AppContext)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [friends, setFriends] = useState<string[]>([])
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadFriendsData()
  }, [currentUser])

  const loadFriendsData = async () => {
    if (!currentUser) return
    try {
      const response = await fetch('http://10.0.2.2:3000/api/users')
      const users = await response.json()
      setAllUsers(users.filter((u: any) => u.email !== currentUser.email))
    } catch (e) {
      console.log('Ошибка загрузки пользователей')
    }

    const savedFriends = await AsyncStorage.getItem(`@friends_${currentUser.email}`)
    setFriends(savedFriends ? JSON.parse(savedFriends) : [])

    const requestsString = await AsyncStorage.getItem('@friendRequests')
    const requests = requestsString ? JSON.parse(requestsString) : []
    setIncomingRequests(requests.filter((r: any) => r.to === currentUser.email && r.status === 'pending'))
    setOutgoingRequests(requests.filter((r: any) => r.from === currentUser.email && r.status === 'pending').map((r: any) => r.to))
  }

  const sendRequest = async (targetEmail: string) => {
    if (!currentUser) return
    if (friends.includes(targetEmail)) {
      Alert.alert('Ошибка', 'Этот пользователь уже у вас в друзьях')
      return
    }
    const requestsString = await AsyncStorage.getItem('@friendRequests')
    const requests = requestsString ? JSON.parse(requestsString) : []
    if (requests.find((r: any) => r.from === currentUser.email && r.to === targetEmail && r.status === 'pending')) {
      Alert.alert('Ошибка', 'Заявка уже отправлена')
      return
    }
    const newRequest = {from: currentUser.email, to: targetEmail, status: 'pending'}
    await AsyncStorage.setItem('@friendRequests', JSON.stringify([...requests, newRequest]))
    Alert.alert('Успех', 'Заявка отправлена!')
    loadFriendsData()
  }

  const acceptRequest = async (fromEmail: string) => {
    if (!currentUser) return
    const myFriends = [...friends, fromEmail]
    await AsyncStorage.setItem(`@friends_${currentUser.email}`, JSON.stringify(myFriends))

    const targetFriendsString = await AsyncStorage.getItem(`@friends_${fromEmail}`)
    const targetFriends = targetFriendsString ? JSON.parse(targetFriendsString) : []
    await AsyncStorage.setItem(`@friends_${fromEmail}`, JSON.stringify([...targetFriends, currentUser.email]))

    const requestsString = await AsyncStorage.getItem('@friendRequests')
    const requests = requestsString ? JSON.parse(requestsString) : []
    const updatedRequests = requests.map((r: any) =>
      (r.from === fromEmail && r.to === currentUser.email) ? {...r, status: 'accepted'} : r
    )
    await AsyncStorage.setItem('@friendRequests', JSON.stringify(updatedRequests))
    Alert.alert('Успех', 'Заявка принята!')
    loadFriendsData()
  }

  const rejectRequest = async (fromEmail: string) => {
    if (!currentUser) return
    const requestsString = await AsyncStorage.getItem('@friendRequests')
    const requests = requestsString ? JSON.parse(requestsString) : []
    const updatedRequests = requests.filter((r: any) => !(r.from === fromEmail && r.to === currentUser.email))
    await AsyncStorage.setItem('@friendRequests', JSON.stringify(updatedRequests))
    Alert.alert('Заявка отклонена')
    loadFriendsData()
  }

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !friends.includes(u.email)
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Друзья</Text>
        <Text style={styles.sectionTitle}>Найти пользователя</Text>
        <TextInput style={styles.input} placeholder="Введите имя..." value={searchQuery} onChangeText={setSearchQuery} />
        {searchQuery.length > 0 && filteredUsers.length === 0 && <Text style={styles.emptyText}>Никого не найдено</Text>}
        {filteredUsers.map((user) => {
          const isRequested = outgoingRequests.includes(user.email)
          return (
            <View key={user.email} style={[styles.card, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
              <View>
                <Text style={{fontSize: 16, fontWeight: 'bold', color: COLORS.text}}>{user.name}</Text>
                <Text style={{fontSize: 12, color: COLORS.textLight}}>{user.email}</Text>
              </View>
              <TouchableOpacity style={[styles.smallButton, isRequested && {backgroundColor: '#E0EAF2'}]} onPress={() => sendRequest(user.email)} disabled={isRequested}>
                <Text style={{color: isRequested ? COLORS.textLight : 'white', fontWeight: 'bold', fontSize: 12}}>{isRequested ? 'Отправлено' : 'Добавить'}</Text>
              </TouchableOpacity>
            </View>
          )
        })}
        {incomingRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Входящие заявки</Text>
            {incomingRequests.map((req, i) => {
              const sender = allUsers.find(u => u.email === req.from)
              return (
                <View key={i} style={styles.card}>
                  <Text style={{fontSize: 16, fontWeight: 'bold', color: COLORS.text}}>{sender?.name || req.from}</Text>
                  <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                    <TouchableOpacity style={[styles.smallButton, {backgroundColor: COLORS.success, flex: 1}]} onPress={() => acceptRequest(req.from)}>
                      <Text style={{color: 'white', fontWeight: 'bold', textAlign: 'center'}}>Принять</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallButton, {backgroundColor: COLORS.error, flex: 1}]} onPress={() => rejectRequest(req.from)}>
                      <Text style={{color: 'white', fontWeight: 'bold', textAlign: 'center'}}>Отклонить</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </>
        )}
        <Text style={styles.sectionTitle}>Мои друзья ({friends.length})</Text>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>У вас пока нет друзей</Text>
        ) : (
          friends.map(email => {
            const friendData = allUsers.find(u => u.email === email)
            return (
              <View key={email} style={styles.card}>
                <Text style={{fontSize: 16, color: COLORS.text}}>🤝 {friendData?.name || email}</Text>
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// 4. ЭКРАН РЕЙТИНГ
// ==========================================
function RatingScreen() {
  const {currentUser, norm} = useContext(AppContext)
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    const loadLeaderboard = async () => {
      let dbString = await AsyncStorage.getItem('@leaderboard')
      let db = dbString ? JSON.parse(dbString) : []
      if (db.length === 0) {
        db = [
          {name: 'Анна', consumed: 1800, norm: 2000},
          {name: 'Дмитрий', consumed: 2200, norm: 2500},
          {name: 'Елена', consumed: 1500, norm: 2000},
        ]
      }
      if (currentUser && !db.find((u: any) => u.name === currentUser.name)) {
        db.push({name: currentUser.name, consumed: 0, norm: norm})
      }
      const sortedDb = db.map((u: any) => ({
        ...u, percent: Math.min((u.consumed / u.norm) * 100, 100),
      })).sort((a: any, b: any) => b.percent - a.percent)
      setLeaderboard(sortedDb)
      await AsyncStorage.setItem('@leaderboard', JSON.stringify(db))
    }
    loadLeaderboard()
  }, [currentUser, norm])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Рейтинг</Text>
        <Text style={styles.greeting}>Кто сегодня лучший?</Text>
        {leaderboard.map((user, index) => {
          const isMe = currentUser && user.name === currentUser.name
          let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
          return (
            <View key={index} style={[styles.card, isMe && {borderColor: COLORS.primary, borderWidth: 2}]}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{fontSize: 24, marginRight: 10}}>{medal}</Text>
                  <View>
                    <Text style={{fontSize: 16, fontWeight: 'bold', color: COLORS.text}}>{user.name} {isMe && '(Вы)'}</Text>
                    <Text style={{fontSize: 12, color: COLORS.textLight}}>{user.consumed} / {user.norm} мл</Text>
                  </View>
                </View>
                <Text style={{fontSize: 18, fontWeight: 'bold', color: user.percent >= 100 ? COLORS.success : COLORS.textLight}}>{Math.round(user.percent)}%</Text>
              </View>
              <View style={[styles.progressBarBg, {marginTop: 10}]}>
                <View style={[styles.progressBarFill, {width: `${user.percent}%`, backgroundColor: user.percent >= 100 ? COLORS.success : COLORS.primary}]} />
              </View>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// 5. ЭКРАН НАСТРОЙКИ
// ==========================================
function SettingsScreen({navigation}: any) {
  const {norm, setNorm} = useContext(AppContext)
  const [newNorm, setNewNorm] = useState(norm.toString())
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const u = await AsyncStorage.getItem('@currentUser')
      if (u) setCurrentUser(JSON.parse(u))
    }
    getUser()
  }, [])

  const saveNorm = () => {
    const num = parseInt(newNorm)
    if (num > 0 && num <= 10000) {
      setNorm(num)
      Alert.alert("Успех", "Цель обновлена!")
    } else {
      Alert.alert("Ошибка", "Введите реальное число")
    }
  }

  const handleLogout = async () => {
    Alert.alert('Выход', 'Вы уверены?', [
      {text: 'Отмена', style: 'cancel'},
      {
        text: 'Выйти', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('@currentUser')
          navigation.replace('Register')
        }
      }
    ])
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Настройки</Text>
        {currentUser && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Текущий пользователь:</Text>
            <Text style={{fontSize: 18, fontWeight: 'bold', color: COLORS.text}}>{currentUser.name}</Text>
            <Text style={{color: COLORS.textLight}}>{currentUser.email}</Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>Твоя цель (мл)</Text>
        <View style={styles.card}>
          <TextInput style={styles.input} value={newNorm} onChangeText={setNewNorm} keyboardType="numeric" />
          <TouchableOpacity style={styles.mainButton} onPress={saveNorm}>
            <Text style={styles.mainButtonText}>Сохранить</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// 6. ЭКРАН НАПОМИНАНИЯ
// ==========================================
function RemindersScreen() {
  const [remindersOn, setRemindersOn] = useState(false)
  const toggleReminders = async () => {
    if (remindersOn) {
      await Notifications.cancelAllScheduledNotificationsAsync()
      setRemindersOn(false)
      Alert.alert("Напоминания", "Отключены")
      return
    }
    const {status} = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Разрешение не получено')
      return
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('water', {
        name: 'Напоминания о воде',
        importance: Notifications.AndroidImportance.MAX,
      })
    }
    setRemindersOn(true)
    await Notifications.scheduleNotificationAsync({
      content: {title: 'Трекер воды', body: 'Не забудьте попить воды! 💧'},
      trigger: null,
    })
    Alert.alert("Успех", "Напоминания включены!")
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Напоминания</Text>
        <TouchableOpacity style={[styles.mainButton, remindersOn && {backgroundColor: COLORS.error}]} onPress={toggleReminders}>
          <Text style={styles.mainButtonText}>{remindersOn ? 'Отключить' : 'Включить'}</Text>
        </TouchableOpacity>
        <View style={styles.card}><Text style={styles.cardLabel}>Частота: каждые 2 часа</Text></View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// 7. ЭКРАН РАСЧЕТА ВОДЫ
// ==========================================
function CalcScreen() {
  const {setNorm} = useContext(AppContext)
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [result, setResult] = useState<number | null>(null)

  const calculate = () => {
    const w = parseFloat(weight)
    if (!w || w < 30 || w > 300) {
      Alert.alert('Ошибка', 'Введите реальный вес')
      return
    }
    setResult(Math.round(w * 30))
  }

  const applyNorm = () => {
    if (result) {
      setNorm(result)
      Alert.alert('Успех', `Твоя норма: ${result} мл`)
      setResult(null)
      setWeight('')
      setHeight('')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Расчет воды</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Твой вес (кг)</Text>
          <TextInput style={styles.input} placeholder="70" keyboardType="numeric" value={weight} onChangeText={setWeight} />
          <Text style={styles.cardLabel}>Твой рост (см)</Text>
          <TextInput style={styles.input} placeholder="175" keyboardType="numeric" value={height} onChangeText={setHeight} />
          <TouchableOpacity style={styles.mainButton} onPress={calculate}>
            <Text style={styles.mainButtonText}>Рассчитать</Text>
          </TouchableOpacity>
        </View>
        {result !== null && (
          <View style={[styles.card, {backgroundColor: '#E0F2FE'}]}>
            <Text style={styles.cardLabel}>Норма воды:</Text>
            <Text style={styles.bigNumber}>{result} мл</Text>
            <TouchableOpacity style={styles.mainButton} onPress={applyNorm}>
              <Text style={styles.mainButtonText}>Применить</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ==========================================
// НАВИГАЦИЯ И ГЛАВНЫЙ КОМПОНЕНТ
// ==========================================
const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: {fontSize: 9, marginBottom: 5},
        tabBarItemStyle: {paddingTop: 5},
        tabBarIcon: ({color}) => {
          let iconName: any
          if (route.name === 'Главная') iconName = 'water-outline'
          else if (route.name === 'История') iconName = 'time-outline'
          else if (route.name === 'Друзья') iconName = 'people-outline'
          else if (route.name === 'Рейтинг') iconName = 'trophy-outline'
          else if (route.name === 'Калькулятор') iconName = 'calculator-outline'
          else if (route.name === 'Настройки') iconName = 'settings-outline'
          else if (route.name === 'Напоминания') iconName = 'notifications-outline'
          return <Ionicons name={iconName} size={22} color={color} />
        },
      })}
    >
      <Tab.Screen name="Главная" component={HomeScreen} />
      <Tab.Screen name="История" component={HistoryScreen} />
      <Tab.Screen name="Друзья" component={FriendsScreen} />
      <Tab.Screen name="Рейтинг" component={RatingScreen} />
      <Tab.Screen name="Калькулятор" component={CalcScreen} />
      <Tab.Screen name="Настройки" component={SettingsScreen} />
      <Tab.Screen name="Напоминания" component={RemindersScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [consumed, setConsumed] = useState(0)
  const [norm, setNorm] = useState(2000)
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [initialRoute, setInitialRoute] = useState('Register')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const userString = await AsyncStorage.getItem('@currentUser')
        if (userString) {
          setCurrentUser(JSON.parse(userString))
          setInitialRoute('MainApp')
        }
        const sConsumed = await AsyncStorage.getItem('@consumed')
        const sNorm = await AsyncStorage.getItem('@norm')
        const sHistory = await AsyncStorage.getItem('@history')
        if (sConsumed) setConsumed(parseInt(sConsumed))
        if (sNorm) setNorm(parseInt(sNorm))
        if (sHistory) setHistory(JSON.parse(sHistory))
      } catch (e) {console.log(e)} finally {setIsLoading(false)}
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('@consumed', consumed.toString())
      AsyncStorage.setItem('@norm', norm.toString())
      AsyncStorage.setItem('@history', JSON.stringify(history))
    }
  }, [consumed, norm, history, isLoading])

  const addWater = (amount: number) => {
    if (amount <= 0) return
    const now = new Date()
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setConsumed(prev => prev + amount)
    setHistory(prev => [{time: timeString, amount}, ...prev])
  }

  const resetDay = () => {
    Alert.alert('Сброс', 'Вы уверены?', [
      {text: 'Отмена', style: 'cancel'},
      {text: 'Сбросить', style: 'destructive', onPress: () => {setConsumed(0); setHistory([])}}
    ])
  }

  if (isLoading) return null

  return (
    <AppContext.Provider value={{consumed, norm, setNorm, addWater, history, resetDay, currentUser}}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName={initialRoute}>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainApp" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  )
}

// ==========================================
// СТИЛИ
// ==========================================
const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: COLORS.bg},
  container: {flex: 1},
  scrollContent: {padding: 20, paddingTop: 50, paddingBottom: 100, flexGrow: 1},
  registerContainer: {padding: 20, paddingTop: 60, flexGrow: 1},
  logoText: {color: COLORS.primary, fontWeight: 'bold', fontSize: 12, letterSpacing: 1, marginBottom: 20},
  title: {fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 5},
  subtitle: {fontSize: 16, color: COLORS.textLight, marginBottom: 30},
  greeting: {fontSize: 16, color: COLORS.textLight, marginBottom: 5},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 20, marginBottom: 10},
  card: {backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2},
  cardLabel: {fontSize: 14, color: COLORS.textLight, marginBottom: 5},
  cardSubtext: {fontSize: 14, color: COLORS.textLight, marginTop: 10},
  bigNumber: {fontSize: 36, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10},
  emptyText: {fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginVertical: 10},
  progressBarBg: {height: 8, backgroundColor: '#E0EAF2', borderRadius: 4, overflow: 'hidden'},
  progressBarFill: {height: '100%', backgroundColor: COLORS.primary, borderRadius: 4},
  mainButton: {backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginVertical: 10},
  mainButtonText: {color: 'white', fontSize: 16, fontWeight: 'bold'},
  smallButton: {backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  quickBtn: {flex: 1, backgroundColor: COLORS.card, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0EAF2'},
  quickBtnText: {color: COLORS.primary, fontWeight: '600'},
  resetButton: {marginTop: 10, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#E0EAF2'},
  resetButtonText: {color: COLORS.primary, fontSize: 16, fontWeight: '600'},
  logoutButton: {marginTop: 30, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2'},
  logoutButtonText: {color: '#D32F2F', fontSize: 16, fontWeight: 'bold'},
  input: {backgroundColor: '#F2F7FA', borderRadius: 10, padding: 15, fontSize: 16, color: COLORS.text, marginBottom: 15, borderWidth: 1, borderColor: '#E0EAF2'},
  hintText: {fontSize: 12, color: COLORS.textLight, marginBottom: 20},
  loginRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10},
  linkText: {color: COLORS.primary, fontWeight: 'bold', fontSize: 14},
  historyRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  historyTime: {fontSize: 14, color: COLORS.textLight, marginBottom: 2},
  historyTitle: {fontSize: 16, color: COLORS.text, fontWeight: '500'},
  historyAmount: {fontSize: 16, color: COLORS.primary, fontWeight: 'bold'},
  tabBar: {backgroundColor: COLORS.card, borderTopWidth: 0, elevation: 10, height: 70, paddingBottom: 10, paddingTop: 5},
  modalOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'},
  modalContent: {backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40},
  modalTitle: {fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 15, textAlign: 'center'},
  cancelButton: {paddingVertical: 12, alignItems: 'center', marginTop: 5},
  cancelButtonText: {color: COLORS.textLight, fontSize: 16},
  inputError: {borderColor: COLORS.error, backgroundColor: '#FFEBEE'},
  errorText: {color: COLORS.error, fontSize: 12, marginTop: -10, marginBottom: 10, marginLeft: 5},
  strengthContainer: {flexDirection: 'row', alignItems: 'center', marginTop: -5, marginBottom: 10},
  strengthBarBg: {flex: 1, height: 6, backgroundColor: '#E0EAF2', borderRadius: 3, marginRight: 10, overflow: 'hidden'},
  strengthBarFill: {height: '100%', borderRadius: 3},
  strengthText: {fontSize: 12, fontWeight: 'bold', width: 60, textAlign: 'right'},
})